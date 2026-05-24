export function smartAlign(xPct, xMinPct, xMaxPct) {
  const rel = (xPct - xMinPct) / Math.max(xMaxPct - xMinPct, 1);
  if (rel < 0.28) return "left";
  if (rel > 0.72) return "right";
  return "center";
}

export function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}
