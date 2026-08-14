"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** True only on the AI Exercise page while the browser tab is in the foreground. */
export function useCameraActive(): boolean {
  const pathname = usePathname();
  const onAiExercisePage = pathname === "/workout" || pathname === "/v2/train";
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const syncVisible = () => setPageVisible(document.visibilityState === "visible");
    const onHide = () => setPageVisible(false);
    const onShow = () => syncVisible();

    syncVisible();
    document.addEventListener("visibilitychange", syncVisible);
    window.addEventListener("pagehide", onHide);
    window.addEventListener("pageshow", onShow);

    return () => {
      document.removeEventListener("visibilitychange", syncVisible);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("pageshow", onShow);
    };
  }, []);

  return onAiExercisePage && pageVisible;
}
