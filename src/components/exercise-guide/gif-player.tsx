"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { freezeGifUrl, loadGif } from "@/lib/exercises/gif-cache";

const SPEEDS = [0.5, 1, 1.5] as const;

export interface GifPlayerProps {
  src: string;
  className?: string;
  showControls?: boolean;
  autoplay?: boolean;
}

/**
 * Smooth human demo player.
 * - 1×: native <img> (browser GPU decode)
 * - 0.5× / 1.5×: cached pre-composited canvas frames
 */
export function GifPlayer({
  src,
  className,
  showControls = true,
  autoplay = true,
}: GifPlayerProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const frameIdxRef = useRef(0);
  const accumRef = useRef(0);
  const lastTimeRef = useRef(0);
  const pausedRef = useRef(!autoplay);
  const speedRef = useRef(1);

  const [paused, setPaused] = useState(!autoplay);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [imgReady, setImgReady] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [error, setError] = useState(false);

  const useCanvas = SPEEDS[speedIdx] !== 1;
  const loading = useCanvas ? !canvasReady : !imgReady;

  const freezeNative = useCallback(() => {
    const img = imgRef.current;
    if (!img?.complete || !img.naturalWidth) return;
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext("2d")!.drawImage(img, 0, 0);
    img.src = c.toDataURL("image/png");
  }, []);

  const startCanvasLoop = useCallback(
    (frames: { delayMs: number; data: ImageData }[]) => {
      cancelAnimationFrame(rafRef.current);
      frameIdxRef.current = 0;
      accumRef.current = 0;
      lastTimeRef.current = 0;

      const tick = (now: number) => {
        if (pausedRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (lastTimeRef.current === 0) lastTimeRef.current = now;
        accumRef.current += (now - lastTimeRef.current) * speedRef.current;
        lastTimeRef.current = now;

        const frame = frames[frameIdxRef.current];
        if (accumRef.current >= frame.delayMs) {
          accumRef.current = 0;
          frameIdxRef.current = (frameIdxRef.current + 1) % frames.length;
          canvas.getContext("2d")!.putImageData(frames[frameIdxRef.current].data, 0, 0);
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [],
  );

  // Canvas mode — only when speed != 1×
  useEffect(() => {
    if (!useCanvas) {
      cancelAnimationFrame(rafRef.current);
      setCanvasReady(false);
      return;
    }

    let cancelled = false;
    setCanvasReady(false);

    loadGif(src)
      .then((gif) => {
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = gif.width;
          canvas.height = gif.height;
          canvas.getContext("2d")!.putImageData(gif.frames[0].data, 0, 0);
        }
        setCanvasReady(true);
        if (autoplay && !pausedRef.current) startCanvasLoop(gif.frames);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [src, useCanvas, autoplay, startCanvasLoop]);

  // Reset img ready when switching back to native
  useEffect(() => {
    if (!useCanvas) setImgReady(false);
  }, [useCanvas, src]);

  const togglePause = useCallback(() => {
    setPaused((p) => {
      const next = !p;
      pausedRef.current = next;

      if (next) {
        cancelAnimationFrame(rafRef.current);
        if (!useCanvas) freezeNative();
      } else if (useCanvas) {
        loadGif(src).then((gif) => startCanvasLoop(gif.frames));
      } else {
        const img = imgRef.current;
        if (img) img.src = `${src}#${Date.now()}`;
      }
      return next;
    });
  }, [useCanvas, freezeNative, src, startCanvasLoop]);

  const cycleSpeed = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setSpeedIdx((i) => {
      const next = (i + 1) % SPEEDS.length;
      speedRef.current = SPEEDS[next];
      return next;
    });
    pausedRef.current = false;
    setPaused(false);
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  if (error) {
    return (
      <div className={cn("flex items-center justify-center bg-[#0a0a0f] text-zinc-600 text-xs", className)}>
        Demo unavailable
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full flex items-center justify-center bg-[#0a0a0f] overflow-hidden", className)}>
      {!useCanvas && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={src}
          alt=""
          className={cn("w-full h-full object-contain transition-opacity", imgReady ? "opacity-100" : "opacity-0")}
          decoding="async"
          onLoad={() => setImgReady(true)}
        />
      )}

      {useCanvas && (
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
          style={{ objectFit: "contain" }}
        />
      )}

      {loading && (
        <div className="absolute inset-0 bg-[#0a0a0f] flex items-center justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
        </div>
      )}

      {showControls && !loading && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
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

/** Static first-frame poster — zero animation overhead on the grid. */
export function GifPoster({ src, className }: { src: string; className?: string }) {
  const [poster, setPoster] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    freezeGifUrl(src)
      .then((url) => {
        if (!cancelled) setPoster(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <div className={cn("w-full h-full bg-[#0a0a0f] flex items-center justify-center overflow-hidden", className)}>
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" className="w-full h-full object-cover object-center" decoding="async" />
      ) : (
        <div className="h-full w-full animate-pulse bg-white/[0.03]" />
      )}
    </div>
  );
}

/** @deprecated use GifPoster */
export function LazyGifPlayer({
  src,
  className,
  autoplay = true,
  showControls = false,
}: GifPlayerProps) {
  if (!autoplay) return <GifPoster src={src} className={className} />;
  return <GifPlayer src={src} className={className} showControls={showControls} autoplay />;
}
