export const replayDuration = 5000;
export const measuredDuration = 1186;
export const displayTimings = {
  before: { first: 1135, complete: 1186, totalSends: 8 },
  after: { first: 246, complete: 1033, totalSends: 3 },
};

// Only first/complete times are measured medians. Intermediate frames and sends are examples.
const displayFrames = {
  before: [[1135, 2], [1152, 6], [1170, 11], [1186, 16]],
  after: [[246, 2], [600, 8], [1033, 16]],
};
const sendFrames = {
  before: Array.from({ length: 8 }, (_, i) => [(i + 1) * 662 / 8, (i + 1) * 200]),
  after: [[83, 200], [383, 800], [655, 1600]],
};

export function mapDisplayFrame(elapsed, side) {
  const ms = Math.max(0, Math.min(replayDuration, elapsed)) / replayDuration * measuredDuration;
  return {
    count: displayFrames[side].filter(([time]) => time <= ms).at(-1)?.[1] ?? 0,
    sent: sendFrames[side].filter(([time]) => time <= ms).map(([, count]) => count),
    first: ms >= displayTimings[side].first,
    complete: ms >= displayTimings[side].complete,
  };
}

export const comparisonPinPositions = Array.from({ length: 16 }, (_, i) => {
  const ring = i < 2 ? { start: 0, size: 2, radius: 8 } : i < 8 ? { start: 2, size: 6, radius: 23 } : { start: 8, size: 8, radius: 39 };
  const angle = (i - ring.start) / ring.size * Math.PI * 2 - Math.PI;
  return [50 + ring.radius * Math.cos(angle), 50 + ring.radius * Math.sin(angle), i * 3 % 5];
});
