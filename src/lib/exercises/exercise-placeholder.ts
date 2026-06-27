import type { MuscleGroup } from "@/lib/exercises/library";
import { findLibraryByKey, findLibraryExerciseByName } from "@/lib/exercises/library";

const MUSCLE_GRADIENT: Record<MuscleGroup, [string, string]> = {
  chest: ["#0e7490", "#06b6d4"],
  back: ["#4338ca", "#6366f1"],
  shoulders: ["#7c3aed", "#a78bfa"],
  biceps: ["#b45309", "#f59e0b"],
  triceps: ["#c2410c", "#fb923c"],
  forearms: ["#475569", "#94a3b8"],
  quads: ["#047857", "#34d399"],
  hamstrings: ["#065f46", "#10b981"],
  glutes: ["#be185d", "#f472b6"],
  calves: ["#0f766e", "#2dd4bf"],
  core: ["#0369a1", "#38bdf8"],
  cardio: ["#dc2626", "#f87171"],
  "full-body": ["#4f46e5", "#818cf8"],
};

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** SVG card used when GIF/video posters are missing or fail to load. */
export function musclePlaceholderUrl(muscle: MuscleGroup, label?: string): string {
  const [from, to] = MUSCLE_GRADIENT[muscle] ?? MUSCLE_GRADIENT["full-body"];
  const title = escapeXml((label ?? muscle).slice(0, 28));
  const tag = escapeXml(muscle.replace("-", " "));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
  <rect width="480" height="360" fill="#050508"/>
  <rect x="24" y="24" width="432" height="312" rx="28" fill="url(#g)" opacity="0.4"/>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <circle cx="240" cy="138" r="44" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="3"/>
  <path d="M218 138h44M240 116v44" stroke="rgba(255,255,255,0.35)" stroke-width="3.5" stroke-linecap="round"/>
  <text x="240" y="228" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="system-ui,-apple-system,sans-serif" font-size="20" font-weight="700">${title}</text>
  <text x="240" y="258" text-anchor="middle" fill="rgba(255,255,255,0.42)" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="600" letter-spacing="0.14em">${tag.toUpperCase()}</text>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function resolveExercisePlaceholder(
  exerciseId?: string,
  exerciseName?: string,
): string {
  const lib =
    (exerciseId ? findLibraryByKey(exerciseId) : undefined) ??
    (exerciseName ? findLibraryExerciseByName(exerciseName) : undefined);

  return musclePlaceholderUrl(lib?.muscle ?? "full-body", lib?.name ?? exerciseName ?? "Exercise");
}
