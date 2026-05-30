// Canvas HUD painter for recorded workout videos.
//
// The live workout screen shows stats (score, reps, phase, timer, coaching
// cues) as React DOM overlays floating *above* the camera feed — they never
// touch the canvas, so they don't end up in the MediaRecorder capture. This
// module paints an equivalent HUD directly onto the compositor canvas so the
// saved video is self-contained: skeleton + stats baked into the pixels.

const FONT_STACK = "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";

export interface RecordingHudState {
  score: number;
  reps: number;
  phase: string;
  elapsedSeconds: number;
  recording: boolean;
  cue?: string;
  bestRep?: number;
}

function scoreColor(s: number): string {
  if (s >= 85) return "#34d399";
  if (s >= 65) return "#fbbf24";
  return "#f43f5e";
}

function formatTime(total: number): string {
  const m = Math.floor(total / 60).toString().padStart(2, "0");
  const sec = Math.max(0, Math.floor(total % 60)).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function glassPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  border = "rgba(255,255,255,0.10)"
) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = "rgba(8,10,14,0.55)";
  ctx.fill();
  ctx.lineWidth = Math.max(1, h * 0.018);
  ctx.strokeStyle = border;
  ctx.stroke();
}

function truncate(
  ctx: CanvasRenderingContext2D,
  str: string,
  maxWidth: number
): string {
  if (ctx.measureText(str).width <= maxWidth) return str;
  let s = str;
  while (s.length > 1 && ctx.measureText(`${s}…`).width > maxWidth) {
    s = s.slice(0, -1);
  }
  return `${s}…`;
}

/**
 * Paint the stats HUD onto the compositor canvas (call after the video +
 * skeleton + ghost layers, with the context in its default, un-mirrored
 * transform so text reads correctly).
 */
export function drawRecordingHud(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: RecordingHudState
) {
  const s = Math.min(W, H) / 720;
  const pad = Math.round(24 * s);

  ctx.save();
  ctx.textBaseline = "alphabetic";

  // Top scrim so light footage doesn't wash out the stats.
  const topGrad = ctx.createLinearGradient(0, 0, 0, Math.round(180 * s));
  topGrad.addColorStop(0, "rgba(0,0,0,0.45)");
  topGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, Math.round(180 * s));

  const panelW = Math.round(150 * s);
  const panelH = Math.round(88 * s);
  const radius = Math.round(18 * s);
  const labelFont = `600 ${Math.round(13 * s)}px ${FONT_STACK}`;
  const valueFont = `800 ${Math.round(44 * s)}px ${FONT_STACK}`;

  // ── Score panel (top-left) ───────────────────────────────────────────
  glassPanel(ctx, pad, pad, panelW, panelH, radius, "rgba(255,255,255,0.10)");
  ctx.textAlign = "center";
  ctx.font = labelFont;
  ctx.fillStyle = "#a1a1aa";
  ctx.fillText("SCORE", pad + panelW / 2, pad + Math.round(26 * s));
  ctx.font = valueFont;
  ctx.fillStyle = scoreColor(state.score);
  ctx.fillText(
    `${Math.round(state.score)}`,
    pad + panelW / 2,
    pad + Math.round(74 * s)
  );

  // ── Reps panel (top-right) ───────────────────────────────────────────
  const repsX = W - pad - panelW;
  glassPanel(ctx, repsX, pad, panelW, panelH, radius, "rgba(255,255,255,0.10)");
  ctx.font = labelFont;
  ctx.fillStyle = "#a1a1aa";
  ctx.fillText("REPS", repsX + panelW / 2, pad + Math.round(26 * s));
  ctx.font = valueFont;
  ctx.fillStyle = "#fafafa";
  ctx.fillText(`${state.reps}`, repsX + panelW / 2, pad + Math.round(74 * s));

  // ── Center column: REC badge, phase pill, timer pill ─────────────────
  let cy = pad;

  if (state.recording) {
    const recFont = `700 ${Math.round(13 * s)}px ${FONT_STACK}`;
    ctx.font = recFont;
    const recText = "REC";
    const dotR = Math.round(5 * s);
    const recTextW = ctx.measureText(recText).width;
    const recPadX = Math.round(14 * s);
    const gap = Math.round(8 * s);
    const recH = Math.round(30 * s);
    const recW = recPadX * 2 + dotR * 2 + gap + recTextW;
    const recX = (W - recW) / 2;
    glassPanel(ctx, recX, cy, recW, recH, recH / 2, "rgba(239,68,68,0.35)");
    ctx.beginPath();
    ctx.arc(recX + recPadX + dotR, cy + recH / 2, dotR, 0, Math.PI * 2);
    ctx.fillStyle = "#ef4444";
    ctx.fill();
    ctx.textAlign = "left";
    ctx.font = recFont;
    ctx.fillStyle = "#fca5a5";
    ctx.fillText(recText, recX + recPadX + dotR * 2 + gap, cy + recH / 2 + Math.round(4.5 * s));
    cy += recH + Math.round(8 * s);
  }

  // Phase pill
  const phaseLabelFont = `600 ${Math.round(11 * s)}px ${FONT_STACK}`;
  const phaseValFont = `700 ${Math.round(16 * s)}px ${FONT_STACK}`;
  const phaseText = (state.phase || "Ready").toUpperCase();
  ctx.font = phaseValFont;
  const phaseTextW = ctx.measureText(phaseText).width;
  const phasePadX = Math.round(18 * s);
  const phaseH = Math.round(52 * s);
  const phaseW = Math.max(Math.round(120 * s), phaseTextW + phasePadX * 2);
  const phaseX = (W - phaseW) / 2;
  glassPanel(ctx, phaseX, cy, phaseW, phaseH, radius, "rgba(34,211,238,0.18)");
  ctx.textAlign = "center";
  ctx.font = phaseLabelFont;
  ctx.fillStyle = "#71717a";
  ctx.fillText("PHASE", W / 2, cy + Math.round(20 * s));
  ctx.font = phaseValFont;
  ctx.fillStyle = "#67e8f9";
  ctx.fillText(phaseText, W / 2, cy + Math.round(42 * s));
  cy += phaseH + Math.round(8 * s);

  // Timer pill
  const timerFont = `700 ${Math.round(15 * s)}px ${FONT_STACK}`;
  const timerLabelFont = `600 ${Math.round(10 * s)}px ${FONT_STACK}`;
  const timerH = Math.round(30 * s);
  const timerW = Math.round(110 * s);
  const timerX = (W - timerW) / 2;
  glassPanel(ctx, timerX, cy, timerW, timerH, timerH / 2, "rgba(255,255,255,0.08)");
  ctx.textAlign = "left";
  ctx.font = timerLabelFont;
  ctx.fillStyle = "#71717a";
  ctx.fillText("TIMER", timerX + Math.round(14 * s), cy + timerH / 2 + Math.round(3.5 * s));
  ctx.textAlign = "right";
  ctx.font = timerFont;
  ctx.fillStyle = "#fafafa";
  ctx.fillText(
    formatTime(state.elapsedSeconds),
    timerX + timerW - Math.round(14 * s),
    cy + timerH / 2 + Math.round(5 * s)
  );

  // ── Coaching cue (bottom center) ─────────────────────────────────────
  if (state.cue && state.cue.trim()) {
    const cueFont = `600 ${Math.round(16 * s)}px ${FONT_STACK}`;
    ctx.font = cueFont;
    const maxCueW = W * 0.82 - Math.round(36 * s);
    const cueText = truncate(ctx, state.cue.trim(), maxCueW);
    const cueTextW = ctx.measureText(cueText).width;
    const cuePadX = Math.round(18 * s);
    const cueH = Math.round(44 * s);
    const cueW = cueTextW + cuePadX * 2;
    const cueX = (W - cueW) / 2;
    const cueY = H - pad - cueH;

    const bottomGrad = ctx.createLinearGradient(0, H - Math.round(140 * s), 0, H);
    bottomGrad.addColorStop(0, "rgba(0,0,0,0)");
    bottomGrad.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, H - Math.round(140 * s), W, Math.round(140 * s));

    const positive = /good|great|nice|perfect|excellent/i.test(cueText);
    glassPanel(
      ctx,
      cueX,
      cueY,
      cueW,
      cueH,
      radius,
      positive ? "rgba(52,211,153,0.25)" : "rgba(251,191,36,0.25)"
    );
    ctx.textAlign = "center";
    ctx.font = cueFont;
    ctx.fillStyle = positive ? "#6ee7b7" : "#fcd34d";
    ctx.fillText(cueText, W / 2, cueY + cueH / 2 + Math.round(6 * s));
  }

  ctx.restore();
}
