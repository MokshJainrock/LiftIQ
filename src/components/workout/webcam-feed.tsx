"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { usePoseDetection } from "@/lib/pose/use-pose-detection";
import { useWorkoutStore } from "@/lib/store";
import { RepDetector } from "@/lib/scoring/rep-detector";
import { getExercise } from "@/lib/exercises";
import { Landmark, JointFeedback } from "@/types";
import { validateStartPosition } from "@/lib/exercises/start-validators";
import { getVoiceManager, classifyCuePriority } from "@/lib/ai/voice";
import { Loader2, Camera, CameraOff, SwitchCamera, CheckCircle2, Sparkles, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { playCountdownTick, playSuccessChime, playStartGong, speakCue, speakCountdown } from "@/lib/audio-cues";
import { GhostCoachOverlay } from "@/components/exercise-guide/ghost-coach-overlay";
import { ReadinessPill } from "@/components/workout/readiness-pill";
import { drawRecordingHud } from "@/lib/pose/recording-hud";
import { assessTrackingQuality, displayScore, type SetupCheckItem } from "@/lib/pose/tracking-confidence";
import { requestLiveCoachCue, resetLiveCoachClient } from "@/lib/ai/live-coach-client";
import { SetupValidationOverlay } from "@/components/workout/setup-validation-overlay";
import { useCameraActive } from "@/lib/pose/use-camera-active";
import { useDepthCapability } from "@/lib/pose/use-depth-capability";

const FORM_CHECK_REQUIRED_FRAMES = 15;

// Maps the semantic joint names emitted by exercise scoring to concrete
// MediaPipe landmark indices, so form faults tint the right nodes/limbs.
// Includes singular + side variants so every exercise config resolves.
const JOINT_LANDMARK_MAP: Record<string, number[]> = {
  knees: [25, 26],
  knee: [25, 26],
  leftKnee: [25],
  rightKnee: [26],
  frontKnee: [25, 26],
  backKnee: [25, 26],
  hips: [23, 24],
  hip: [23, 24],
  leftHip: [23],
  rightHip: [24],
  torso: [11, 12, 23, 24],
  back: [11, 12, 23, 24],
  spine: [11, 12, 23, 24],
  elbows: [13, 14],
  elbow: [13, 14],
  leftElbow: [13],
  rightElbow: [14],
  arms: [13, 14, 15, 16],
  arm: [13, 14, 15, 16],
  wrists: [15, 16],
  wrist: [15, 16],
  hands: [15, 16],
  hand: [15, 16],
  shoulders: [11, 12],
  shoulder: [11, 12],
  leftShoulder: [11],
  rightShoulder: [12],
  ankles: [27, 28],
  ankle: [27, 28],
  frontAnkle: [27, 28],
  head: [0],
  neck: [0, 11, 12],
};

interface WebcamFeedProps {
  mobile?: boolean;
  ghostCoachEnabled?: boolean;
  onDismissGhostCoach?: () => void;
}

export function WebcamFeed({ mobile = false, ghostCoachEnabled, onDismissGhostCoach }: WebcamFeedProps) {
  const {
    selectedExercise,
    isWorkoutActive,
    isPaused,
    isRecording,
    isCountingDown,
    isFormChecking,
    countdownSeconds,
    setCountdownSeconds,
    finishCountdown,
    passFormCheck,
    setCurrentScore,
    setRepCount,
    setCurrentPhase,
    setCurrentCues,
    setCurrentIssues,
    addRepResult,
    setRecordingBlob,
    settings,
    updateSettings,
    setPoseStatus,
    setReadiness,
    selectedExerciseLabel,
    setTrackingQuality,
    setAiLiveCue,
  } = useWorkoutStore();

  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">(settings.cameraFacing || "environment");
  const [zoomLevel, setZoomLevel] = useState<"0.5x" | "1x">("1x");
  const [zoomSupported, setZoomSupported] = useState(false);
  const [formCheckProgress, setFormCheckProgress] = useState(0);
  const [formDetectedBanner, setFormDetectedBanner] = useState(false);
  const [formCheckHint, setFormCheckHint] = useState("");
  const [setupChecklist, setSetupChecklist] = useState<SetupCheckItem[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Compositor — paints video + live skeleton + ghost coach into one canvas
  // so MediaRecorder can capture the full overlay (not just the raw camera).
  const compositorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ghostCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const compositorRafRef = useRef<number>(0);

  const repDetectorRef = useRef<RepDetector | null>(null);
  // Freshest landmarks for the recording compositor, with a timestamp so a
  // lost pose can't leave a frozen skeleton baked into the clip.
  const latestLandmarksRef = useRef<{ lms: Landmark[]; t: number } | null>(null);
  const exerciseRef = useRef(selectedExercise);
  const formCheckFramesRef = useRef(0);
  const lastHintRef = useRef("");
  const lastPlayedSecondRef = useRef(-1);
  const coachModeDefaultedRef = useRef(false);
  const { setVoiceInfo } = useWorkoutStore();
  const cameraActive = useCameraActive();
  // Depth/LiDAR assist — read via ref inside the per-frame callback.
  const depthAssistRef = useRef(false);

  // First time we mount on a mobile screen, swap the user into minimal
  // coaching mode — the full ghost overlay isn't a great fit for phone
  // viewports. Toggling stays sticky for the rest of the session.
  useEffect(() => {
    if (!isWorkoutActive) {
      resetLiveCoachClient();
      setAiLiveCue("");
    }
  }, [isWorkoutActive, setAiLiveCue]);

  useEffect(() => {
    if (coachModeDefaultedRef.current) return;
    coachModeDefaultedRef.current = true;
    if (mobile && settings.coachingMode !== "minimal") {
      updateSettings({ coachingMode: "minimal" });
    }
  }, [mobile, settings.coachingMode, updateSettings]);

  const coachingMode = settings.coachingMode;
  const handleToggleCoachMode = () => {
    updateSettings({ coachingMode: coachingMode === "ghost" ? "minimal" : "ghost" });
  };

  useEffect(() => {
    if (!isCountingDown || countdownSeconds <= 0) return;

    if (lastPlayedSecondRef.current !== countdownSeconds) {
      lastPlayedSecondRef.current = countdownSeconds;
      playCountdownTick(countdownSeconds);
      speakCountdown(countdownSeconds);
    }

    const timer = setTimeout(() => {
      const next = countdownSeconds - 1;
      if (next <= 0) {
        playStartGong();
        lastPlayedSecondRef.current = -1;
        finishCountdown();
      } else {
        setCountdownSeconds(next);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [isCountingDown, countdownSeconds, setCountdownSeconds, finishCountdown]);

  const handleFlipCamera = () => {
    const next = cameraFacing === "user" ? "environment" : "user";
    setCameraFacing(next);
    updateSettings({ cameraFacing: next });
    if (next === "user") {
      setZoomSupported(false);
      setZoomLevel("1x");
    }
  };

  const videoElRef = useRef<HTMLVideoElement | null>(null);

  const getVideoTrack = () => {
    const video = videoElRef.current;
    if (!video?.srcObject) return null;
    return (video.srcObject as MediaStream).getVideoTracks()[0] ?? null;
  };

  const applyZoom = useCallback((level: "0.5x" | "1x") => {
    const track = getVideoTrack();
    if (!track) return;
    const caps = track.getCapabilities() as MediaTrackCapabilities & { zoom?: { min: number; max: number } };
    if (!caps.zoom) return;
    const targetZoom = level === "0.5x" ? caps.zoom.min : Math.min(2, caps.zoom.max);
    track.applyConstraints({ advanced: [{ zoom: targetZoom } as Record<string, unknown>] } as MediaTrackConstraints);
  }, []);

  const handleToggleZoom = () => {
    const next = zoomLevel === "1x" ? "0.5x" : "1x";
    setZoomLevel(next);
    applyZoom(next);
  };

  const checkZoomSupport = useCallback(() => {
    if (cameraFacing !== "environment") { setZoomSupported(false); return; }
    const track = getVideoTrack();
    if (!track) { setZoomSupported(false); return; }
    const caps = track.getCapabilities() as MediaTrackCapabilities & { zoom?: { min: number; max: number } };
    const supported = !!caps.zoom && caps.zoom.max > caps.zoom.min;
    setZoomSupported(supported);
    if (supported && mobile) {
      setZoomLevel("0.5x");
      applyZoom("0.5x");
    }
  }, [cameraFacing, mobile, applyZoom]);

  // Wire VoiceManager state changes into Zustand for UI reactivity
  useEffect(() => {
    const vm = getVoiceManager();
    const unsub = vm.onChange((info) => setVoiceInfo(info));
    return () => { unsub(); };
  }, [setVoiceInfo]);

  useEffect(() => {
    const config = getExercise(selectedExercise);
    if (config) {
      repDetectorRef.current = new RepDetector(config);
      exerciseRef.current = selectedExercise;
    } else {
      repDetectorRef.current = null;
    }
    getVoiceManager().resetFrameCounts();
  }, [selectedExercise]);

  // Reset form-check tracking when entering form-check phase
  useEffect(() => {
    if (isFormChecking) {
      formCheckFramesRef.current = 0;
      setFormCheckProgress(0);
      setFormDetectedBanner(false);
      setFormCheckHint("");
      lastHintRef.current = "";
      speakCue("Checking your form now. Get into the starting position.", true);
    }
  }, [isFormChecking]);

  useEffect(() => {
    if (isWorkoutActive) {
      const config = getExercise(exerciseRef.current);
      if (config) {
        repDetectorRef.current = new RepDetector(config);
      }
    }
  }, [isWorkoutActive]);

  // Manage voice coach lifecycle: stop on workout end, pause/resume, and mute on toggle
  useEffect(() => {
    const vm = getVoiceManager();
    if (!isWorkoutActive) {
      vm.resetSession();
    } else if (isPaused || !settings.voiceEnabled) {
      vm.pause();
    } else {
      vm.resume();
    }
  }, [isWorkoutActive, isPaused, settings.voiceEnabled]);

  // Latest joint-color map. Updated whenever the rep detector produces fresh
  // issues, and read by the pose hook on every render so the live overlay
  // shows the correct tint without us having to re-trigger the redraw.
  const liveJointColorsRef = useRef<Map<number, string> | undefined>(undefined);

  const computeJointColors = useCallback(
    (issues: JointFeedback[], config: ReturnType<typeof getExercise>) => {
      const colors = new Map<number, string>();
      if (!config) return colors;

      for (const joint of config.targetJoints) {
        colors.set(joint, "#00e68a");
      }

      for (const issue of issues) {
        const color =
          issue.status === "poor"
            ? "#f87171"
            : issue.status === "moderate"
            ? "#facc15"
            : "#00e68a";

        const indices = JOINT_LANDMARK_MAP[issue.joint] || [];
        for (const idx of indices) {
          colors.set(idx, color);
        }
      }

      return colors;
    },
    []
  );

  const handleFrame = useCallback(
    (landmarks: Landmark[]) => {
      latestLandmarksRef.current = { lms: landmarks, t: performance.now() };
      const CORE_LANDMARKS = [11, 12, 13, 14, 23, 24];
      const MIN_VIS = 0.6;
      const coreVisible = CORE_LANDMARKS.filter(
        (idx) => landmarks[idx] && (landmarks[idx].visibility ?? 0) >= MIN_VIS
      ).length;

      // The pose hook owns the live overlay redraw — `handleFrame` only feeds
      // back state (scores, reps, joint tints). This keeps the skeleton
      // updating every detection frame, even when state-driven branches below
      // would otherwise early-return.

      if (isFormChecking) {
        const config = getExercise(exerciseRef.current);
        if (!config) return;

        const setupQuality = assessTrackingQuality(landmarks, cameraFacing, depthAssistRef.current);
        setSetupChecklist(setupQuality.checklist);
        setTrackingQuality(setupQuality.tier, setupQuality.scoreAvailable, setupQuality.label);

        // ---- 1) Framing check (cheap, kinematic-free) -----------------
        // We need at least the upper body visible to even attempt
        // pose-family classification; everything else can be advised on.
        const shouldersOk = (landmarks[11]?.visibility ?? 0) >= MIN_VIS
          && (landmarks[12]?.visibility ?? 0) >= MIN_VIS;
        const hipsOk = (landmarks[23]?.visibility ?? 0) >= MIN_VIS
          && (landmarks[24]?.visibility ?? 0) >= MIN_VIS;
        const anklesOk = (landmarks[27]?.visibility ?? 0) >= 0.4
          || (landmarks[28]?.visibility ?? 0) >= 0.4;

        let framingHint = "";
        if (coreVisible < 4) framingHint = "Step fully into the camera view";
        else if (!shouldersOk || !hipsOk) framingHint = "Make sure your upper body is visible";
        else if (!anklesOk) framingHint = "Make sure your full body is visible, including your feet";

        if (framingHint) {
          formCheckFramesRef.current = Math.max(0, formCheckFramesRef.current - 3);
          setFormCheckProgress(Math.min(100, Math.round((formCheckFramesRef.current / FORM_CHECK_REQUIRED_FRAMES) * 100)));
          setFormCheckHint(framingHint);
          setReadiness("framing", framingHint);
          if (framingHint !== lastHintRef.current) {
            lastHintRef.current = framingHint;
            speakCue(framingHint);
          }
          return;
        }

        // ---- 2) Exercise-specific start-pose validation ----------------
        // Pose-family classifier + per-exercise rules. This is the gate
        // that prevents "selected push-up but standing/squatting" from
        // ever advancing into the active workout state.
        const verdict = validateStartPosition(exerciseRef.current, landmarks);

        if (verdict.isValid && setupQuality.tier !== "low") {
          formCheckFramesRef.current++;
          const holdHint = "Hold your position...";
          setFormCheckHint(holdHint);
          setReadiness("ready", "Hold this position");
          if (lastHintRef.current !== holdHint) {
            lastHintRef.current = holdHint;
            speakCue("Looking good! Hold that position.");
          }
          setFormCheckProgress(Math.min(100, Math.round((formCheckFramesRef.current / FORM_CHECK_REQUIRED_FRAMES) * 100)));

          if (formCheckFramesRef.current >= FORM_CHECK_REQUIRED_FRAMES) {
            setFormDetectedBanner(true);
            setFormCheckHint("");
            playSuccessChime();
            speakCue("Form is correct! Let's start the workout!", true);
            setTimeout(() => {
              passFormCheck();
              setFormDetectedBanner(false);
            }, 2000);
          }
        } else {
          // Stronger penalty when the pose family is clearly wrong (e.g.
          // standing while push-up is selected) — that's not a small drift,
          // it's the wrong exercise. Reset the frame counter outright.
          const familyMismatch = verdict.detectedFamily !== "unknown"
            && verdict.reasons.some((r) => /plank|standing upright|seated|on the floor/i.test(r));
          if (familyMismatch) {
            formCheckFramesRef.current = 0;
          } else {
            formCheckFramesRef.current = Math.max(0, formCheckFramesRef.current - 2);
          }
          setFormCheckProgress(Math.min(100, Math.round((formCheckFramesRef.current / FORM_CHECK_REQUIRED_FRAMES) * 100)));

          const primary = verdict.reasons[0] ?? "Get into the starting position";
          const detail = verdict.reasons[1];
          const hintText = detail ? `${primary} ${detail}` : primary;
          setFormCheckHint(hintText);
          setReadiness(familyMismatch ? "wrong_pose" : "almost", primary);
          if (lastHintRef.current !== hintText) {
            lastHintRef.current = hintText;
            speakCue(primary);
          }
        }
        return;
      }

      // Outside form-check & workout, there are no joint tints to compute —
      // the live overlay will already have been (re)drawn by the pose hook
      // using the freshest landmarks.
      if (!isWorkoutActive || isPaused || !repDetectorRef.current) {
        liveJointColorsRef.current = undefined;
        return;
      }
      if (coreVisible < 4) return;

      const quality = assessTrackingQuality(landmarks, cameraFacing, depthAssistRef.current);
      setSetupChecklist(quality.checklist);
      setTrackingQuality(quality.tier, quality.scoreAvailable, quality.label);

      const result = repDetectorRef.current.update(landmarks);
      const display = displayScore(result.score, quality.tier);
      setCurrentScore(display ?? 0);
      setRepCount(result.repCount);
      setCurrentPhase(result.phase);

      const issueMessages = result.issues.map((i) => i.message).filter(Boolean) as string[];
      const mergedCues = [...result.cues];
      setCurrentCues(mergedCues);
      setCurrentIssues(result.issues);

      const exerciseLabel =
        selectedExerciseLabel ||
        exerciseRef.current.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const coachKey = `${quality.tier}:${issueMessages.join("|")}:${result.phase}:${result.repCount}`;
      requestLiveCoachCue(
        coachKey,
        {
          exerciseName: exerciseLabel,
          phase: result.phase,
          repCount: result.repCount,
          score: display,
          confidenceTier: quality.tier,
          issues: issueMessages,
          ruleCues: result.cues,
        },
        (aiCue) => {
          setAiLiveCue(aiCue);
          if (quality.tier !== "low") {
            setCurrentCues([aiCue, ...result.cues].slice(0, 3));
          }
          if (settings.voiceEnabled && quality.tier === "high") {
            getVoiceManager().speakCue(aiCue, classifyCuePriority(aiCue), {
              exercise: exerciseRef.current,
              phase: result.phase,
              repCount: result.repCount,
              score: display ?? result.score,
            });
          }
        },
      );

      if (result.repCompleted && result.repResult) {
        const rep = {
          ...result.repResult,
          scoreReliable: quality.scoreAvailable,
          score: quality.scoreAvailable ? result.repResult.score : 0,
        };
        addRepResult(rep);
      }

      // Family-mismatch nudge: surface a one-shot cue (don't spam every
      // frame). Reps are already suppressed by the rep detector.
      if (result.familyMismatch && lastHintRef.current !== "family-mismatch") {
        lastHintRef.current = "family-mismatch";
        setCurrentCues(["Get back into the starting position to continue."]);
        speakCue("Get back into the starting position to continue.");
        setReadiness("off_track", "Return to the starting position");
      } else if (!result.familyMismatch && lastHintRef.current === "family-mismatch") {
        lastHintRef.current = "";
        setReadiness("active", "");
      } else if (!result.familyMismatch) {
        setReadiness("active", "");
      }

      if (settings.voiceEnabled) {
        const vm = getVoiceManager();
        const meta = {
          exercise: exerciseRef.current,
          phase: result.phase,
          repCount: result.repCount,
          score: display ?? result.score,
        };
        if (quality.tier === "medium") {
          for (const cue of result.cues.slice(0, 1)) {
            vm.speakCue(cue, classifyCuePriority(cue), meta);
          }
        }
        if (result.repCompleted) {
          vm.speakEncouragement(result.repCount);
        }
      }

      const config = getExercise(exerciseRef.current);
      // Stash the colors so the pose hook applies them on this same frame's
      // redraw (it reads `liveJointColorsRef` synchronously after `onFrame`).
      liveJointColorsRef.current = computeJointColors(result.issues, config);
    },
    [
      isWorkoutActive,
      isPaused,
      isFormChecking,
      passFormCheck,
      setCurrentScore,
      setRepCount,
      setCurrentPhase,
      setCurrentCues,
      setCurrentIssues,
      addRepResult,
      setReadiness,
      settings.voiceEnabled,
      computeJointColors,
      cameraFacing,
      selectedExerciseLabel,
      setTrackingQuality,
      setAiLiveCue,
    ]
  );

  const { videoRef, canvasRef, status, landmarks: liveLandmarks, drawSkeletonToCtx } = usePoseDetection({
    onFrame: handleFrame,
    getJointColors: () => liveJointColorsRef.current,
    enabled: cameraActive,
    facingMode: cameraFacing,
  });

  const depthCapability = useDepthCapability(status === "detecting");

  useEffect(() => {
    depthAssistRef.current = depthCapability.depthAssist;
  }, [depthCapability.depthAssist]);

  useEffect(() => {
    videoElRef.current = videoRef.current;
  });

  useEffect(() => {
    setPoseStatus(status);
    if (status === "detecting") checkZoomSupport();
  }, [status, setPoseStatus, checkZoomSupport]);

  // Compositor loop — draws video + live skeleton overlay + ghost coach
  // into a single hidden canvas so MediaRecorder can capture the full frame.
  // Runs only while we're recording (cheap when idle).
  useEffect(() => {
    const wantRecord = isWorkoutActive && isRecording;
    if (!wantRecord) return;

    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const composite = compositorCanvasRef.current;
      const video = videoRef.current;
      if (composite && video && video.videoWidth > 0) {
        if (composite.width !== video.videoWidth || composite.height !== video.videoHeight) {
          composite.width = video.videoWidth;
          composite.height = video.videoHeight;
        }
        const ctx = composite.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, composite.width, composite.height);

          // 1) Camera frame (mirrored when using the front camera, like on screen)
          ctx.save();
          if (cameraFacing === "user") {
            ctx.translate(composite.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(video, 0, 0, composite.width, composite.height);
          ctx.restore();

          // 2) Skeleton — redrawn directly at the video's native resolution so
          // joints land exactly on the body in the saved clip. (Copying the
          // on-screen overlay canvas would bake in its object-cover crop for a
          // *different* aspect ratio and drift at the edges.) With box == src
          // dimensions the object-cover transform is an exact identity mapping.
          const latest = latestLandmarksRef.current;
          if (latest && performance.now() - latest.t < 500) {
            ctx.save();
            if (cameraFacing === "user") {
              ctx.translate(composite.width, 0);
              ctx.scale(-1, 1);
            }
            drawSkeletonToCtx(
              ctx,
              composite.width,
              composite.height,
              composite.width,
              composite.height,
              latest.lms,
              liveJointColorsRef.current,
              { clear: false },
            );
            ctx.restore();
          }

          // 3) Ghost coach overlay — mirrored like the live view (its CSS
          // applies scaleX(-1) on the front camera).
          const ghost = ghostCanvasRef.current;
          if (ghostCoachEnabled && ghost && ghost.width > 0 && ghost.height > 0) {
            ctx.save();
            if (cameraFacing === "user") {
              ctx.translate(composite.width, 0);
              ctx.scale(-1, 1);
            }
            ctx.drawImage(ghost, 0, 0, composite.width, composite.height);
            ctx.restore();
          }

          // 4) Stats HUD (score / reps / phase / timer / cue). Drawn last, in
          // the default un-mirrored transform so the text reads correctly.
          // Pulled straight from the store each frame so values stay live
          // without re-subscribing the compositor effect.
          const st = useWorkoutStore.getState();
          const elapsed = st.sessionStartTime
            ? Math.floor((Date.now() - st.sessionStartTime) / 1000)
            : 0;
          drawRecordingHud(ctx, composite.width, composite.height, {
            score: st.scoreAvailable ? st.currentScore : null,
            reps: st.repCount,
            phase: st.currentPhase?.trim() || "Ready",
            elapsedSeconds: elapsed,
            recording: true,
            cue: st.currentCues[0],
            bestRep: st.bestRepScore,
          });
        }
      }
      compositorRafRef.current = requestAnimationFrame(tick);
    };
    compositorRafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (compositorRafRef.current) cancelAnimationFrame(compositorRafRef.current);
    };
  }, [isWorkoutActive, isRecording, ghostCoachEnabled, cameraFacing, videoRef, drawSkeletonToCtx]);

  // Start/stop MediaRecorder. Prefer the compositor canvas (with overlays);
  // fall back to the raw camera stream if captureStream is unavailable.
  useEffect(() => {
    if (!isWorkoutActive || !isRecording) return;
    const video = videoRef.current;
    if (!video?.srcObject) return;

    recordedChunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";

    let chosenStream: MediaStream | null = null;

    // Try compositor stream first (carries skeleton + ghost overlay).
    const composite = compositorCanvasRef.current;
    const captureStream =
      composite && (composite as HTMLCanvasElement & { captureStream?: (fps?: number) => MediaStream }).captureStream;
    if (composite && typeof captureStream === "function") {
      try {
        chosenStream = captureStream.call(composite, 30);
      } catch {
        chosenStream = null;
      }
    }

    // Fallback: raw camera stream (legacy behavior — no overlay in playback).
    if (!chosenStream) {
      chosenStream = video.srcObject as MediaStream;
    }

    let recorder: MediaRecorder | null = null;
    try {
      recorder = new MediaRecorder(chosenStream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          setRecordingBlob(blob);
        }
        recordedChunksRef.current = [];
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
    } catch {
      console.warn("MediaRecorder not supported");
    }

    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
    };
  }, [isWorkoutActive, isRecording, videoRef, setRecordingBlob]);

  return (
    <div
      className={cn(
        "webcam-container relative bg-black overflow-hidden",
        mobile
          ? "w-full h-full rounded-none border-0"
          : "h-[min(58dvh,440px)] w-full sm:h-auto sm:aspect-video rounded-none sm:rounded-2xl"
      )}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: cameraFacing === "user" ? "scaleX(-1)" : "none" }}
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ transform: cameraFacing === "user" ? "scaleX(-1)" : "none" }}
      />

      {/* Ghost coach overlay — live-synced to the user's pose & pace.
          Suppressed in minimal coaching mode (phones / users who prefer
          the lightweight readiness pill). */}
      {ghostCoachEnabled && coachingMode === "ghost" && selectedExercise && onDismissGhostCoach && (
        <GhostCoachOverlay
          exerciseId={selectedExercise}
          landmarks={liveLandmarks}
          mirror={cameraFacing === "user"}
          compact={mobile}
          onDismiss={onDismissGhostCoach}
          canvasRefExternal={ghostCanvasRef}
        />
      )}

      {/* Minimal coaching mode — readiness pill at top center, no ghost. */}
      {coachingMode === "minimal" && selectedExercise && (
        <div
          className={cn(
            "absolute z-20 left-1/2 -translate-x-1/2 pointer-events-none",
            mobile ? "top-3" : "top-4",
          )}
        >
          <ReadinessPill />
        </div>
      )}

      {/* Hidden compositor canvas — captured by MediaRecorder during recording */}
      <canvas
        ref={compositorCanvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute -z-10 opacity-0"
        style={{ width: 1, height: 1 }}
      />

      {/* Camera controls */}
      {status === "detecting" && (
        <div className={cn("absolute z-20 flex items-center gap-2", mobile ? "top-3 right-3" : "top-4 right-4")}>
          {zoomSupported && cameraFacing === "environment" && (
            <button
              onClick={handleToggleZoom}
              className={cn(
                "rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all hover:bg-black/70 active:scale-95",
                mobile ? "h-9 px-3" : "h-10 px-3.5"
              )}
            >
              <span className={cn("text-white font-bold tabular-nums", mobile ? "text-xs" : "text-sm")}>
                {zoomLevel}
              </span>
            </button>
          )}
          <button
            onClick={handleToggleCoachMode}
            className={cn(
              "rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all hover:bg-black/70 active:scale-95",
              mobile ? "h-9 w-9" : "h-10 w-10"
            )}
            title={coachingMode === "ghost" ? "Switch to minimal coaching" : "Switch to ghost coach"}
            aria-label={coachingMode === "ghost" ? "Switch to minimal coaching" : "Switch to ghost coach"}
          >
            {coachingMode === "ghost" ? (
              <Sparkles className={cn("text-purple-300", mobile ? "h-4 w-4" : "h-5 w-5")} />
            ) : (
              <Gauge className={cn("text-primary", mobile ? "h-4 w-4" : "h-5 w-5")} />
            )}
          </button>
          <button
            onClick={handleFlipCamera}
            className={cn(
              "rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all hover:bg-black/70 active:scale-95",
              mobile ? "h-9 w-9" : "h-10 w-10"
            )}
            title={cameraFacing === "user" ? "Switch to back camera" : "Switch to front camera"}
          >
            <SwitchCamera className={cn("text-white", mobile ? "h-4 w-4" : "h-5 w-5")} />
          </button>
        </div>
      )}

      {/* Countdown overlay */}
      {isCountingDown && countdownSeconds > 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-30">
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-3">Get into position</div>
            <div
              key={countdownSeconds}
              className="text-8xl md:text-9xl font-black text-white tabular-nums animate-[pulse_1s_ease-in-out]"
              style={{ textShadow: "0 0 40px color-mix(in srgb, var(--primary) 40%, transparent)" }}
            >
              {countdownSeconds}
            </div>
            <div className="mt-4 w-48 mx-auto h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((10 - countdownSeconds) / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Form-check / setup validation overlay */}
      {isFormChecking && !formDetectedBanner && (
        <SetupValidationOverlay
          progress={formCheckProgress}
          hint={formCheckHint}
          checklist={setupChecklist}
          ready={formCheckProgress >= 100}
          depthLabel={depthCapability.label}
          depthActive={depthCapability.depthAssist}
        />
      )}

      {/* Form detected banner */}
      {formDetectedBanner && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-30">
          <div className="text-center px-6 animate-[fadeIn_0.4s_ease-out]">
            <div className="mx-auto mb-4 h-16 w-16 flex items-center justify-center rounded-full bg-emerald-500/20 border-2 border-emerald-400">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-emerald-400 mb-1">
              Form is Correct!
            </div>
            <div className="text-sm text-white/70">
              Let's start the workout!
            </div>
          </div>
        </div>
      )}

      {/* Camera paused when user leaves AI Exercise tab or switches browser tab */}
      {!cameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 z-[25]">
          <CameraOff className={cn("text-zinc-400 mb-3", mobile ? "h-8 w-8" : "h-10 w-10")} />
          <p className={cn("text-zinc-400 text-center px-8 max-w-sm", mobile ? "text-xs" : "text-sm")}>
            Camera paused — return to Train to resume
          </p>
        </div>
      )}

      {/* Status overlays */}
      {(status === "loading" || status === "ready") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10">
          <Loader2 className={cn("text-primary animate-spin mb-4", mobile ? "h-8 w-8" : "h-10 w-10")} />
          <p className={cn("text-muted-foreground text-center px-8", mobile ? "text-xs" : "text-sm")}>
            {status === "loading"
              ? "Loading pose detection model..."
              : "Camera ready — waiting for detection..."}
          </p>
        </div>
      )}

      {status === "no-camera" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10">
          <CameraOff className={cn("text-destructive mb-4", mobile ? "h-8 w-8" : "h-10 w-10")} />
          <p className={cn("text-muted-foreground text-center px-8", mobile ? "text-xs" : "text-sm")}>
            Camera access denied. Please allow camera permissions and refresh.
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10">
          <Camera className={cn("text-yellow-400 mb-4", mobile ? "h-8 w-8" : "h-10 w-10")} />
          <p className={cn("text-muted-foreground text-center px-8", mobile ? "text-xs" : "text-sm")}>
            Error loading pose detection. Please refresh and try again.
          </p>
        </div>
      )}

      {/* Workout not started overlay */}
      {status === "detecting" && !isWorkoutActive && !isFormChecking && !isCountingDown && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
          <div className="glass-card rounded-xl px-6 py-4 text-center mx-4">
            <p className={cn("text-foreground", mobile ? "text-xs" : "text-sm")}>
              Select an exercise and press <strong>Start</strong> to begin
            </p>
          </div>
        </div>
      )}

      {/* Paused overlay */}
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="glass-card rounded-xl px-8 py-6 text-center">
            <p className="text-2xl font-bold text-primary">PAUSED</p>
            <p className="text-sm text-muted-foreground mt-1">
              Press Resume to continue
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
