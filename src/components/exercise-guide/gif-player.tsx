"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseGIF, decompressFrames } from "gifuct-js";
import { Play, Pause, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

const SPEEDS = [0.5, 1, 1.5] as const;

interface GifFrame {
  dims: { width: number; height: number; top: number; left: number };
  patch: Uint8ClampedArray;
  delay: number;
}

export interface GifPlayerProps {
  src: string;
  className?: string;
  showControls?: boolean;
  /** When false, shows first frame only (for thumbnails). */
  autoplay?: boolean;
}

export function GifPlayer({
  src,
  className,
  showControls = true,
  autoplay = true,
}: GifPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<GifFrame[]>([]);
  const frameIdxRef = useRef(0);
  const accumRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef(0);
  const pausedRef = useRef(!autoplay);
  const speedRef = useRef(1);

  const [paused, setPaused] = useState(!autoplay);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const blitFrame = useCallback((idx: number) => {
    const canvas = canvasRef.current;
    const frame = framesRef.current[idx];
    if (!canvas || !frame) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = new ImageData(
      new Uint8ClampedArray(frame.patch),
      frame.dims.width,
      frame.dims.height,
    );
    ctx.putImageData(imageData, frame.dims.left, frame.dims.top);
  }, []);

  const tick = useCallback(
    (now: number) => {
      if (pausedRef.current) return;
      const frames = framesRef.current;
      if (!frames.length) return;

      if (lastTimeRef.current === 0) lastTimeRef.current = now;
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      accumRef.current += dt * speedRef.current;

      const frame = frames[frameIdxRef.current];
      const delayMs = Math.max((frame?.delay ?? 8) * 10, 20);

      if (accumRef.current >= delayMs) {
        accumRef.current = 0;
        frameIdxRef.current = (frameIdxRef.current + 1) % frames.length;
        blitFrame(frameIdxRef.current);
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [blitFrame],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    framesRef.current = [];
    frameIdxRef.current = 0;
    accumRef.current = 0;
    lastTimeRef.current = 0;
    cancelAnimationFrame(rafRef.current);

    fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.arrayBuffer();
      })
      .then((buf) => {
        if (cancelled) return;
        const gif = parseGIF(buf);
        const frames = decompressFrames(gif, true) as GifFrame[];
        if (!frames.length) throw new Error("no frames");
        framesRef.current = frames;

        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = gif.lsd.width;
          canvas.height = gif.lsd.height;
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
          blitFrame(0);
        }

        setLoading(false);
        pausedRef.current = !autoplay;
        setPaused(!autoplay);

        if (autoplay) {
          lastTimeRef.current = 0;
          rafRef.current = requestAnimationFrame(tick);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [src, autoplay, blitFrame, tick]);

  const togglePause = useCallback(() => {
    setPaused((p) => {
      const next = !p;
      pausedRef.current = next;
      if (!next) {
        lastTimeRef.current = 0;
        rafRef.current = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(rafRef.current);
      }
      return next;
    });
  }, [tick]);

  const cycleSpeed = useCallback(() => {
    setSpeedIdx((i) => {
      const next = (i + 1) % SPEEDS.length;
      speedRef.current = SPEEDS[next];
      return next;
    });
  }, []);

  if (error) {
    return (
      <div className={cn("flex items-center justify-center bg-[#0a0a0f] text-zinc-600 text-xs", className)}>
        Demo unavailable
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full flex items-center justify-center bg-[#0a0a0f]", className)}>
      <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
      {loading && (
        <div className="absolute inset-0 bg-[#0a0a0f] flex items-center justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
        </div>
      )}
      {showControls && !loading && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={cycleSpeed}
            className={cn(
              "flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-sm border border-white/[0.08] px-2 py-1 text-[10px] font-bold tabular-nums transition-colors hover:bg-black/90",
              speedIdx !== 1 ? "text-purple-300 border-purple-500/20" : "text-zinc-400",
            )}
          >
            <Gauge className="h-3 w-3" />
            {SPEEDS[speedIdx]}x
          </button>
          <button
            type="button"
            onClick={togglePause}
            className="flex items-center justify-center h-7 w-7 rounded-full bg-black/70 backdrop-blur-sm border border-white/[0.08] text-zinc-400 transition-colors hover:text-white hover:bg-black/90"
          >
            {paused ? <Play className="h-3 w-3 ml-0.5" /> : <Pause className="h-3 w-3" />}
          </button>
        </div>
      )}
    </div>
  );
}

/** Only mounts the GIF decoder when visible — stops lag from off-screen animations. */
export function LazyGifPlayer({
  src,
  className,
  showControls = false,
  autoplay = true,
  placeholderClassName,
}: GifPlayerProps & { placeholderClassName?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "80px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("w-full h-full", className)}>
      {visible ? (
        <GifPlayer src={src} showControls={showControls} autoplay={autoplay} className="w-full h-full" />
      ) : (
        <div className={cn("w-full h-full bg-[#0a0a0f]", placeholderClassName)} />
      )}
    </div>
  );
}

/** Static first-frame thumbnail — no animation, minimal CPU. */
export function GifPoster({ src, className }: { src: string; className?: string }) {
  return (
    <LazyGifPlayer
      src={src}
      autoplay={false}
      showControls={false}
      className={className}
    />
  );
}
