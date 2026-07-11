"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_DEPTH_CAPABILITY,
  getDepthCapability,
  type DepthCapability,
} from "@/lib/pose/depth-sensing";

/**
 * Resolves the device's depth/LiDAR capability once on mount, then re-probes
 * shortly after (camera labels populate only after permission is granted).
 */
export function useDepthCapability(cameraReady = false): DepthCapability {
  const [capability, setCapability] = useState<DepthCapability>(DEFAULT_DEPTH_CAPABILITY);

  useEffect(() => {
    let mounted = true;
    getDepthCapability().then((cap) => {
      if (mounted) setCapability(cap);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Re-probe after the camera stream is live so multi-lens labels are visible.
  useEffect(() => {
    if (!cameraReady) return;
    let mounted = true;
    getDepthCapability().then((cap) => {
      if (mounted) setCapability(cap);
    });
    return () => {
      mounted = false;
    };
  }, [cameraReady]);

  return capability;
}
