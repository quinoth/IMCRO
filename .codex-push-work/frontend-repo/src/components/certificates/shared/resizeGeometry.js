export function resizeBox({
  leftMm,
  topMm,
  widthMm,
  heightMm,
  dxMm,
  dyMm,
  handle,
  minWidthMm = 8,
  minHeightMm = 6,
}) {
  const sourceLeft = Number(leftMm) || 0;
  const sourceTop = Number(topMm) || 0;
  const sourceWidth = Math.max(minWidthMm, Number(widthMm) || minWidthMm);
  const sourceHeight = Math.max(minHeightMm, Number(heightMm) || minHeightMm);
  let nextLeft = sourceLeft;
  let nextTop = sourceTop;
  let nextRight = sourceLeft + sourceWidth;
  let nextBottom = sourceTop + sourceHeight;

  if (handle.includes("l")) {
    nextLeft = Math.min(sourceLeft + dxMm, nextRight - minWidthMm);
  }
  if (handle.includes("r")) {
    nextRight = Math.max(sourceLeft + minWidthMm, sourceLeft + sourceWidth + dxMm);
  }
  if (handle.includes("t")) {
    nextTop = Math.min(sourceTop + dyMm, nextBottom - minHeightMm);
  }
  if (handle.includes("b")) {
    nextBottom = Math.max(sourceTop + minHeightMm, sourceTop + sourceHeight + dyMm);
  }

  return {
    leftMm: Math.round(nextLeft * 10) / 10,
    topMm: Math.round(nextTop * 10) / 10,
    widthMm: Math.round((nextRight - nextLeft) * 10) / 10,
    heightMm: Math.round((nextBottom - nextTop) * 10) / 10,
  };
}
