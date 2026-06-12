// Shared decoded GIF frame cache — parse each URL once, reuse everywhere.

import { parseGIF, decompressFrames } from "gifuct-js";

export interface CachedGif {
  width: number;
  height: number;
  /** Full composited RGBA bitmap per frame. */
  frames: { delayMs: number; data: ImageData }[];
}

const cache = new Map<string, CachedGif>();
const inflight = new Map<string, Promise<CachedGif>>();

function compositeAll(
  raw: ReturnType<typeof decompressFrames>,
  width: number,
  height: number,
): CachedGif["frames"] {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const out: CachedGif["frames"] = [];

  for (const rawFrame of raw) {
    const frame = rawFrame as typeof rawFrame & { patch: Uint8ClampedArray };
    const patch = new ImageData(
      new Uint8ClampedArray(frame.patch),
      frame.dims.width,
      frame.dims.height,
    );
    ctx.putImageData(patch, frame.dims.left, frame.dims.top);
    out.push({
      delayMs: Math.max(frame.delay * 10, 33),
      data: ctx.getImageData(0, 0, width, height),
    });

    if (frame.disposalType === 2) {
      ctx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
    } else if (frame.disposalType === 3 && out.length > 1) {
      ctx.putImageData(out[out.length - 2].data, 0, 0);
    }
  }

  return out;
}

export function loadGif(url: string): Promise<CachedGif> {
  const hit = cache.get(url);
  if (hit) return Promise.resolve(hit);

  const pending = inflight.get(url);
  if (pending) return pending;

  const promise = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error("fetch failed");
      return r.arrayBuffer();
    })
    .then((buf) => {
      const gif = parseGIF(buf);
      const raw = decompressFrames(gif, true);
      if (!raw.length) throw new Error("no frames");
      const entry: CachedGif = {
        width: gif.lsd.width,
        height: gif.lsd.height,
        frames: compositeAll(raw, gif.lsd.width, gif.lsd.height),
      };
      cache.set(url, entry);
      inflight.delete(url);
      return entry;
    })
    .catch((e) => {
      inflight.delete(url);
      throw e;
    });

  inflight.set(url, promise);
  return promise;
}

/** Capture the first frame as a PNG data URL (for static thumbnails). */
export function freezeGifUrl(url: string): Promise<string> {
  return loadGif(url).then((gif) => {
    const c = document.createElement("canvas");
    c.width = gif.width;
    c.height = gif.height;
    c.getContext("2d")!.putImageData(gif.frames[0].data, 0, 0);
    return c.toDataURL("image/png");
  });
}
