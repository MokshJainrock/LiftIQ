"use client";

import { useEffect } from "react";
import "@/lib/pose/mediapipe-console-filter";
import { ensureStorageOwner } from "@/lib/storage";

export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.id) ensureStorageOwner(data.user.id);
      })
      .catch(() => {});
  }, []);

  return <>{children}</>;
}
