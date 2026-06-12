// Canvas equipment props drawn on top of the skeleton demo.

import type { PoseFrame } from "@/lib/exercises/exercise-visual-guides";
import type { DemoEquipment, DemoPosition } from "@/lib/exercises/demo-spec";

type Pt = { x: number; y: number };

export interface DrawCtx {
  ctx: CanvasRenderingContext2D;
  toCanvas: (p: Pt) => Pt;
  scale: number;
  ghost: boolean;
}

function handPt(pose: PoseFrame, side: "side" | "front", which: "left" | "right" | "single"): Pt | null {
  if (side === "front") {
    const k = which === "left" ? "leftHand" : which === "right" ? "rightHand" : "leftHand";
    const p = pose[k];
    return p ? { x: p.x, y: p.y } : null;
  }
  return pose.hand ? { x: pose.hand.x, y: pose.hand.y } : null;
}

function bothHands(pose: PoseFrame, side: "side" | "front"): [Pt, Pt] | null {
  if (side === "front" && pose.leftHand && pose.rightHand) {
    return [{ x: pose.leftHand.x, y: pose.leftHand.y }, { x: pose.rightHand.x, y: pose.rightHand.y }];
  }
  if (pose.hand && pose.elbow) {
    const h = pose.hand;
    const e = pose.elbow;
    const dx = h.x - e.x;
    const dy = h.y - e.y;
    return [
      { x: h.x - 8, y: h.y },
      { x: h.x + 8, y: h.y },
    ];
  }
  return null;
}

function alpha(ghost: boolean, a: number) {
  return ghost ? a * 0.55 : a;
}

/** Barbell — long horizontal bar through both hands. */
export function drawBarbell(d: DrawCtx, pose: PoseFrame, side: "side" | "front") {
  const hands = bothHands(pose, side);
  if (!hands) return;
  const [a, b] = hands.map(d.toCanvas);
  const { ctx, scale } = d;
  const barLen = side === "front" ? 52 * d.scale : 44 * d.scale;
  const cx = (a.x + b.x) / 2;
  const cy = (a.y + b.y) / 2;
  ctx.save();
  ctx.strokeStyle = `rgba(161,161,170,${alpha(d.ghost, 0.95)})`;
  ctx.lineWidth = 3 * scale;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - barLen / 2, cy);
  ctx.lineTo(cx + barLen / 2, cy);
  ctx.stroke();
  // Plates
  for (const px of [cx - barLen / 2 + 4 * scale, cx + barLen / 2 - 4 * scale]) {
    ctx.fillStyle = `rgba(113,113,122,${alpha(d.ghost, 0.9)})`;
    ctx.fillRect(px - 3 * scale, cy - 10 * scale, 6 * scale, 20 * scale);
  }
  ctx.restore();
}

/** One or two dumbbells at hand positions. */
export function drawDumbbells(d: DrawCtx, pose: PoseFrame, side: "side" | "front", single = false) {
  const { ctx, scale } = d;
  const drawOne = (p: Pt) => {
    const c = d.toCanvas(p);
    ctx.fillStyle = `rgba(113,113,122,${alpha(d.ghost, 0.92)})`;
    ctx.strokeStyle = `rgba(161,161,170,${alpha(d.ghost, 0.95)})`;
    ctx.lineWidth = 1.5 * scale;
    // Handle
    ctx.beginPath();
    ctx.roundRect(c.x - 3 * scale, c.y - 2 * scale, 6 * scale, 4 * scale, 1 * scale);
    ctx.fill();
    ctx.stroke();
    // Head (weight)
    ctx.beginPath();
    ctx.roundRect(c.x - 7 * scale, c.y - 9 * scale, 14 * scale, 18 * scale, 2 * scale);
    ctx.fill();
    ctx.stroke();
  };

  if (side === "front" && !single && pose.leftHand && pose.rightHand) {
    drawOne({ x: pose.leftHand.x, y: pose.leftHand.y });
    drawOne({ x: pose.rightHand.x, y: pose.rightHand.y });
  } else {
    const h = handPt(pose, side, "single");
    if (h) drawOne(h);
  }
}

/** Cable stack + line to hands. */
export function drawCable(
  d: DrawCtx,
  pose: PoseFrame,
  side: "side" | "front",
  anchor: "high" | "low" | "mid" = "high",
) {
  const { ctx, scale, toCanvas } = d;
  const anchorY = anchor === "high" ? 18 : anchor === "low" ? 240 : 120;
  const anchorX = side === "front" ? 150 : 200;
  const ax = toCanvas({ x: anchorX, y: anchorY });

  // Stack box
  ctx.fillStyle = `rgba(63,63,70,${alpha(d.ghost, 0.85)})`;
  ctx.fillRect(ax.x - 8 * scale, ax.y - 4 * scale, 16 * scale, 28 * scale);

  const targets: Pt[] = [];
  if (side === "front" && pose.leftHand && pose.rightHand) {
    targets.push({ x: pose.leftHand.x, y: pose.leftHand.y }, { x: pose.rightHand.x, y: pose.rightHand.y });
  } else if (pose.hand) {
    targets.push({ x: pose.hand.x, y: pose.hand.y });
  }

  ctx.strokeStyle = `rgba(234,179,8,${alpha(d.ghost, 0.75)})`;
  ctx.lineWidth = 1.5 * scale;
  for (const t of targets) {
    const tc = toCanvas(t);
    ctx.beginPath();
    ctx.moveTo(ax.x, ax.y + 12 * scale);
    ctx.lineTo(tc.x, tc.y);
    ctx.stroke();
    ctx.fillStyle = `rgba(234,179,8,${alpha(d.ghost, 0.9)})`;
    ctx.beginPath();
    ctx.arc(tc.x, tc.y, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Machine frame — seat, back pad, lever arms vary by variant. */
export function drawMachine(
  d: DrawCtx,
  pose: PoseFrame,
  side: "side" | "front",
  variant: "press" | "leg-press" | "pec-deck" | "row" | "leg-ext" | "leg-curl" | "calf" | "hack-squat",
) {
  const { ctx, scale, toCanvas } = d;
  const hip = pose.hip ?? pose.leftHip;
  if (!hip && variant !== "leg-press") return;
  const hc = hip ? toCanvas({ x: hip.x, y: hip.y }) : toCanvas({ x: 150, y: 160 });

  ctx.fillStyle = `rgba(63,63,70,${alpha(d.ghost, 0.7)})`;
  ctx.strokeStyle = `rgba(113,113,122,${alpha(d.ghost, 0.8)})`;
  ctx.lineWidth = 1.5 * scale;

  if (variant === "leg-press") {
    // Seat + foot platform
    ctx.fillRect(hc.x - 35 * scale, hc.y - 8 * scale, 50 * scale, 14 * scale);
    const foot = pose.frontAnkle ?? pose.leftAnkle;
    if (foot) {
      const fc = toCanvas({ x: foot.x, y: foot.y });
      ctx.fillRect(fc.x - 5 * scale, fc.y - 25 * scale, 10 * scale, 28 * scale);
      ctx.fillRect(fc.x - 22 * scale, fc.y - 28 * scale, 44 * scale, 8 * scale);
    }
    return;
  }

  if (variant === "pec-deck") {
    ctx.fillRect(hc.x - 30 * scale, hc.y - 5 * scale, 40 * scale, 12 * scale);
    ctx.fillRect(hc.x - 38 * scale, hc.y - 35 * scale, 8 * scale, 35 * scale);
    if (pose.leftHand && pose.rightHand) {
      const lh = toCanvas({ x: pose.leftHand.x, y: pose.leftHand.y });
      const rh = toCanvas({ x: pose.rightHand.x, y: pose.rightHand.y });
      ctx.strokeStyle = `rgba(161,161,170,${alpha(d.ghost, 0.9)})`;
      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.moveTo(lh.x, lh.y);
      ctx.lineTo(hc.x - 20 * scale, hc.y - 20 * scale);
      ctx.moveTo(rh.x, rh.y);
      ctx.lineTo(hc.x + 20 * scale, hc.y - 20 * scale);
      ctx.stroke();
    }
    return;
  }

  // Generic seated machine: seat + back pad + handles
  ctx.fillRect(hc.x - 28 * scale, hc.y, 36 * scale, 10 * scale);
  ctx.fillRect(hc.x - 32 * scale, hc.y - 38 * scale, 8 * scale, 40 * scale);

  if (variant === "leg-ext" && pose.frontKnee) {
    const kc = toCanvas({ x: pose.frontKnee.x, y: pose.frontKnee.y });
    ctx.fillRect(kc.x, kc.y - 4 * scale, 18 * scale, 8 * scale);
  }
  if (variant === "leg-curl" && pose.backKnee) {
    const kc = toCanvas({ x: pose.backKnee.x, y: pose.backKnee.y });
    ctx.fillRect(kc.x - 20 * scale, kc.y - 4 * scale, 18 * scale, 8 * scale);
  }
}

export function drawPullUpBar(d: DrawCtx) {
  const { ctx, scale, toCanvas } = d;
  const a = toCanvas({ x: 120, y: 22 });
  const b = toCanvas({ x: 180, y: 22 });
  ctx.strokeStyle = `rgba(161,161,170,${alpha(d.ghost, 0.95)})`;
  ctx.lineWidth = 4 * scale;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

export function drawBench(d: DrawCtx, incline = false) {
  const { ctx, scale, toCanvas } = d;
  const y = 175;
  const a = toCanvas({ x: incline ? 70 : 60, y: incline ? 150 : y });
  const b = toCanvas({ x: 240, y });
  ctx.fillStyle = `rgba(82,82,91,${alpha(d.ghost, 0.65)})`;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(b.x, b.y + 8 * scale);
  ctx.lineTo(a.x, a.y + 8 * scale);
  ctx.closePath();
  ctx.fill();
}

export function drawKettlebell(d: DrawCtx, pose: PoseFrame, side: "side" | "front") {
  const h = handPt(pose, side, "single");
  if (!h) return;
  const c = d.toCanvas(h);
  const { ctx, scale } = d;
  ctx.fillStyle = `rgba(113,113,122,${alpha(d.ghost, 0.9)})`;
  ctx.beginPath();
  ctx.arc(c.x, c.y + 6 * scale, 10 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(161,161,170,${alpha(d.ghost, 0.9)})`;
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.arc(c.x, c.y - 2 * scale, 6 * scale, Math.PI, 0);
  ctx.stroke();
}

export function drawBand(d: DrawCtx, pose: PoseFrame, anchor: "floor" | "high") {
  drawCable(d, pose, "side", anchor === "floor" ? "low" : "high");
}

export function drawEquipment(
  d: DrawCtx,
  pose: PoseFrame,
  side: "side" | "front",
  equipment: DemoEquipment,
  position: DemoPosition,
) {
  if (position === "lying" || position === "incline") {
    drawBench(d, position === "incline");
  }

  switch (equipment.type) {
    case "barbell":
      drawBarbell(d, pose, side);
      break;
    case "dumbbell":
      drawDumbbells(d, pose, side, equipment.single);
      break;
    case "cable":
      drawCable(d, pose, side, equipment.anchor);
      break;
    case "machine":
      drawMachine(d, pose, side, equipment.variant);
      break;
    case "kettlebell":
      drawKettlebell(d, pose, side);
      break;
    case "pull-up-bar":
      drawPullUpBar(d);
      break;
    case "band":
      drawBand(d, pose, equipment.anchor);
      break;
    case "bodyweight":
      break;
    case "cardio":
      break;
  }
}
