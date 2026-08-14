"use client";

import { usePathname } from "next/navigation";
import { featurePath } from "@/lib/liftiq/app-paths";

/** Returns a function that keeps in-app links inside `/v2` when the new UI is active. */
export function useFeaturePath() {
  const pathname = usePathname();
  return (path: string) => featurePath(pathname, path);
}
