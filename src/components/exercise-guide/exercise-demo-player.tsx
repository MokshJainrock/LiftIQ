"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExerciseDemoPlayerProps {
  videoSrc?: string;
  gifSrc?: string;
  className?: string;
  showControls?: boolean;
  autoplay?: boolean;
}

/** Preload demo media before opening the detail modal. */
export function preloadExerciseDemo(videoSrc?: string, gifSrc?: string) {
  if (typeof window === "undefined") return;
  if (videoSrc) {
    const v = document.createElement("video");
    v.preload = "auto";
    v.muted = true;
    v.src = videoSrc;
    v.load();
  } else if (gifSrc) {
    const img = new Image();
    img.decoding = "async";
    img.src = gifSrc;
  }
}

export function ExerciseDemoPlayer({
  videoSrc,
  gifSrc,
  className,
  showControls = true,
  autoplay = true,
}: ExerciseDemoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const frozenRef = useRef<string | null>(null);
  const useVideo = !!videoSrc;

  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(!autoplay);
  const [error, setError] = useState(false);

  useEffect(() => {
    setReady(false);
    setError(false);
    setPaused(!autoplay);
    frozenRef.current = null;
  }, [videoSrc, gifSrc, autoplay, useVideo]);

  useEffect(() => {
    const el = videoRef.current;
    if (!useVideo || !el || !autoplay) return;
    if (paused) {
      el.pause();
    } else {
      el.play().catch(() => {});
    }
  }, [useVideo, autoplay, paused, ready]);

  const togglePause = useCallback(() => {
    if (useVideo) {
      const v = videoRef.current;
      if (!v) return;
      setPaused((p) => {
        const next = !p;
        if (next) v.pause();
        else v.play().catch(() => {});
        return next;
      });
      return;
    }

    const img = imgRef.current;
    if (!img || !gifSrc) return;

    setPaused((p) => {
      const next = !p;
      if (next) {
        if (!img.complete || !img.naturalWidth) return next;
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext("2d")!.drawImage(img, 0, 0);
        frozenRef.current = c.toDataURL("image/png");
        img.src = frozenRef.current;
      } else {
        img.src = `${gifSrc}${gifSrc.includes("?") ? "&" : "?"}play=${Date.now()}`;
        frozenRef.current = null;
      }
      return next;
    });
  }, [useVideo, gifSrc]);

  if (!videoSrc && !gifSrc) {
    return (
      <div className={cn("flex items-center justify-center bg-[#0a0a0f] text-zinc-600 text-xs", className)}>
        Demo unavailable
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center bg-[#0a0a0f] text-zinc-600 text-xs", className)}>
        Demo unavailable
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full h-full flex items-center justify-center bg-[#0a0a0f] overflow-hidden",
        className,
      )}
      style={{ contain: "strict", transform: "translateZ(0)" }}
    >
      {useVideo ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className={cn(
            "max-w-full max-h-full w-auto h-auto object-contain transition-opacity duration-150",
            ready ? "opacity-100" : "opacity-0",
          )}
          autoPlay={autoplay && !paused}
          loop
          muted
          playsInline
          preload="auto"
          onCanPlay={() => setReady(true)}
          onError={() => setError(true)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={gifSrc}
          alt=""
          className={cn(
            "max-w-full max-h-full w-auto h-auto object-contain transition-opacity duration-150",
            ready ? "opacity-100" : "opacity-0",
          )}
          decoding="async"
          fetchPriority="high"
          onLoad={() => setReady(true)}
          onError={() => setError(true)}
        />
      )}

      {!ready && (
        <div className="absolute inset-0 bg-[#0a0a0f] flex items-center justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
        </div>
      )}

      {showControls && ready && (
        <div className="absolute bottom-3 right-3 z-10">
          <button
            type="button"
            onClick={togglePause}
            className="flex items-center justify-center h-7 w-7 rounded-full bg-black/70 border border-white/[0.08] text-zinc-400 transition-colors hover:text-white hover:bg-black/90"
          >
            {paused ? <Play className="h-3 w-3 ml-0.5" /> : <Pause className="h-3 w-3" />}
          </button>
        </div>
      )}
    </div>
  );
}
