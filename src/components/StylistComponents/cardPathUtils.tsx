type BuildCardPathArgs = {
  width: number;
  height: number;
  radius: number;
  topRightX: number;
  midRightX: number;
  bottomRightX: number;
};

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.max(min, Math.min(max, value));
}

/**
 * Screen-space rail X map.
 * Screenshot দেখে hand-fit করা values.
 * Y বাড়লে rail কোথায় আছে সেটা return করে.
 */
export function getRailXForScreenY(screenY: number) {
  'worklet';

  const points = [
    { y: 210, x: 330 },
    { y: 250, x: 342 },
    { y: 300, x: 330 },
    { y: 360, x: 304 },
    { y: 430, x: 286 },
    { y: 500, x: 282 },
    { y: 570, x: 292 },
    { y: 640, x: 307 },
    { y: 720, x: 326 },
  ];

  if (screenY <= points[0].y) return points[0].x;
  if (screenY >= points[points.length - 1].y) {
    return points[points.length - 1].x;
  }

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];

    if (screenY >= a.y && screenY <= b.y) {
      const t = (screenY - a.y) / (b.y - a.y);
      return a.x + (b.x - a.x) * t;
    }
  }

  return points[points.length - 1].x;
}

export function getRightEdgeXs(params: {
  cardLeft: number;
  width: number;
  topScreenY: number;
  midScreenY: number;
  bottomScreenY: number;
}) {
  'worklet';

  const { cardLeft, width, topScreenY, midScreenY, bottomScreenY } = params;

  const topRailX = getRailXForScreenY(topScreenY);
  const midRailX = getRailXForScreenY(midScreenY);
  const bottomRailX = getRailXForScreenY(bottomScreenY);

  /**
   * Baseline width যেটায় rail fit ভালো ছিল
   * আপনি future এ এই value বদলাতে চাইলে বদলাতে পারবেন
   */
  const BASE_WIDTH = 364;

  /**
   * width বাড়লে edge naturally rail-এর দিকে যাবে
   * width কমলে edge একটু পিছাবে
   */
  const widthDelta = width - BASE_WIDTH;

  /**
   * rail-এর সাথে final visual gap
   * negative = rail-এর আরও কাছে
   * positive = rail থেকে একটু দূরে
   */
  const VISUAL_GAP = -1;

  /**
   * width বাড়া/কমার effect partially apply করা হচ্ছে
   * full apply করলে shape aggressive হয়ে যায়
   */
  const autoOffset = widthDelta * 0.9 + VISUAL_GAP;

  const minX = width - 110;
  const maxX = width - 2;

  const topRightX = clamp(topRailX - cardLeft + autoOffset, minX, maxX);
  const midRightX = clamp(midRailX - cardLeft + autoOffset, minX, maxX);
  const bottomRightX = clamp(bottomRailX - cardLeft + autoOffset, minX, maxX);

  return {
    topRightX,
    midRightX,
    bottomRightX,
  };
}

export function buildCardPath({
  width,
  height,
  radius,
  topRightX,
  midRightX,
  bottomRightX,
}: BuildCardPathArgs) {
  'worklet';

  const r = clamp(radius, 0, 24);

  return `
    M ${r} 0
    L ${topRightX - r} 0
    Q ${topRightX} 0 ${topRightX} ${r}
    L ${topRightX} ${height * 0.22}
    C ${midRightX} ${height * 0.35}
      ${midRightX} ${height * 0.65}
      ${bottomRightX} ${height * 0.82}
    L ${bottomRightX} ${height - r}
    Q ${bottomRightX} ${height} ${bottomRightX - r} ${height}
    L ${r} ${height}
    Q 0 ${height} 0 ${height - r}
    L 0 ${r}
    Q 0 0 ${r} 0
    Z
  `;
}
