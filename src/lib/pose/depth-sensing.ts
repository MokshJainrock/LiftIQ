// Depth / LiDAR capability layer.
//
// A browser (even Safari on a LiDAR iPhone) cannot read the raw LiDAR sensor
// directly — that requires a native ARKit app. What we CAN do from the web:
//   1. Probe the WebXR Depth Sensing API (real depth on supported AR devices,
//      mostly ARCore/Android). When present we can consume actual depth.
//   2. Enumerate the rear camera array. Devices with a multi-lens rear system
//      (wide + ultra-wide + tele) — i.e. iPhone Pro / high-end Android — are
//      the same devices that ship LiDAR/ToF, and their ultra-wide fits a full
//      body in tight gym spaces. That's a genuinely useful, detectable signal.
//
// We surface these as a capability object that (a) drives an honest UI badge and
// (b) lets the tracking-confidence layer relax framing thresholds for depth-class
// hardware, improving overlay lock-on for those users.

export interface DepthCapability {
  /** WebXR depth-sensing is available (true depth stream possible). */
  webxrDepth: boolean;
  /** Device exposes multiple rear cameras — LiDAR/Pro-class hardware. */
  multiRearCamera: boolean;
  /** An ultra-wide rear lens appears available (better full-body framing). */
  ultraWide: boolean;
  /** iOS device (LiDAR is iPhone/iPad Pro only; used for messaging). */
  isAppleMobile: boolean;
  /** Any depth-class enhancement is available for this session. */
  depthAssist: boolean;
  /** Short UI label. */
  label: string;
  /** Longer, honest explanation for tooltips. */
  detail: string;
}

export const DEFAULT_DEPTH_CAPABILITY: DepthCapability = {
  webxrDepth: false,
  multiRearCamera: false,
  ultraWide: false,
  isAppleMobile: false,
  depthAssist: false,
  label: "Standard tracking",
  detail: "Vision-only pose tracking (no depth sensor detected).",
};

function isAppleMobileUA(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ reports as Mac; disambiguate with touch points.
  const iPadOS = /Macintosh/.test(ua) && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(ua) || iPadOS;
}

/** Probe the WebXR Depth Sensing API. Safe on unsupported browsers. */
export async function detectWebXRDepth(): Promise<boolean> {
  try {
    const xr = (navigator as Navigator & { xr?: { isSessionSupported?: (m: string) => Promise<boolean> } }).xr;
    if (!xr?.isSessionSupported) return false;
    const arSupported = await xr.isSessionSupported("immersive-ar").catch(() => false);
    if (!arSupported) return false;
    // The depth-sensing feature descriptor only exists where the API is present.
    return typeof (window as { XRDepthInformation?: unknown }).XRDepthInformation !== "undefined";
  } catch {
    return false;
  }
}

/**
 * Inspect the rear camera array. Requires camera permission for labels to be
 * populated; call this AFTER the stream is granted for best results.
 */
export async function detectCameraSystem(): Promise<{ multiRear: boolean; ultraWide: boolean }> {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) return { multiRear: false, ultraWide: false };
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((d) => d.kind === "videoinput");
    const labels = videoInputs.map((d) => d.label.toLowerCase());

    const rear = labels.filter(
      (l) => l.includes("back") || l.includes("rear") || l.includes("environment"),
    );
    const ultraWide = labels.some((l) => l.includes("ultra") || l.includes("wide angle") || l.includes("0.5"));

    // ≥2 distinct rear cameras (or ≥3 total video inputs) implies a multi-lens
    // depth-class module. Fall back to total count when labels are generic.
    const multiRear = rear.length >= 2 || videoInputs.length >= 3;
    return { multiRear, ultraWide };
  } catch {
    return { multiRear: false, ultraWide: false };
  }
}

/** Resolve the full depth capability for this session. */
export async function getDepthCapability(): Promise<DepthCapability> {
  const isAppleMobile = isAppleMobileUA();
  const [webxrDepth, camera] = await Promise.all([detectWebXRDepth(), detectCameraSystem()]);

  const depthAssist = webxrDepth || camera.multiRear;

  let label = "Standard tracking";
  let detail = "Vision-only pose tracking (no depth sensor detected).";

  if (webxrDepth) {
    label = "Depth sensing active";
    detail = "WebXR depth stream detected — using real depth for framing and overlay lock-on.";
  } else if (camera.multiRear) {
    label = isAppleMobile ? "LiDAR-class camera" : "Multi-lens depth camera";
    detail = isAppleMobile
      ? "Pro camera system with LiDAR detected. Using the ultra-wide lens + depth-class framing for a more accurate overlay."
      : "Multi-lens rear camera detected — using wide framing for better full-body overlay accuracy.";
  }

  return {
    webxrDepth,
    multiRearCamera: camera.multiRear,
    ultraWide: camera.ultraWide,
    isAppleMobile,
    depthAssist,
    label,
    detail,
  };
}
