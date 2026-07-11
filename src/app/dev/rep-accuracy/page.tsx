import { notFound } from "next/navigation";
import { RepAccuracyHarness } from "@/components/dev/rep-accuracy-harness";

/**
 * INTERNAL rep-counter accuracy harness. This page only exists in development
 * (`npm run dev`). In any production build it returns 404, so end-users can
 * never reach it. Do NOT link to it from the app navigation.
 */
export const dynamic = "force-dynamic";

export default function RepAccuracyPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <RepAccuracyHarness />;
}
