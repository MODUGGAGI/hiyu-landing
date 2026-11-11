export const scenes = [
  { id: "create", duration: 3800, chapter: 0 },
  { id: "color", duration: 6400, chapter: 0 },
  { id: "groups", duration: 2000, chapter: 1 },
  { id: "room", duration: 8600, chapter: 1 },
  { id: "select", duration: 2500, chapter: 2 },
  { id: "memo", duration: 3000, chapter: 2 },
  { id: "locate", duration: 3100, chapter: 2 },
  { id: "map", duration: 3700, chapter: 2 },
];
export const tourDuration = scenes.reduce(
  (sum, scene) => sum + scene.duration,
  0,
);
export const sceneStart = (id) => {
  let time = 0;
  for (const scene of scenes) {
    if (scene.id === id) return time;
    time += scene.duration;
  }
  return 0;
};
export function tourFrame(time) {
  let cursor = ((time % tourDuration) + tourDuration) % tourDuration;
  for (const scene of scenes) {
    if (cursor < scene.duration)
      return { ...scene, progress: cursor / scene.duration };
    cursor -= scene.duration;
  }
}
// The color at the end of the sheet is carried to the group and the map.
export function tourHue(frame) {
  if (frame.id === "create") return 166;
  if (frame.id !== "color") return 166;
  if (frame.progress >= 1) return 166;
  return 166 + Math.sin(frame.progress * Math.PI * 2) * 155;
}

// Separate display phones share the app UI, but keep their own local clocks.
export const registrationScenes = [
  { id: "select", duration: 850, chapter: 2 },
  { id: "memo", duration: 1400, chapter: 2 },
  { id: "locate", duration: 650, chapter: 2 },
  { id: "map", duration: 1400, chapter: 2 },
];
export const registrationDuration = registrationScenes.reduce(
  (sum, scene) => sum + scene.duration,
  0,
);
export const colorSweepDuration = 4200;
export const automaticTapInterval = 145;

export function showcaseFrame(demo, time) {
  if (demo === "ranking") return { id: "ranking", chapter: 3, progress: 0 };
  if (demo === "stamp") return { id: "color", chapter: 0, progress: 0 };
  if (demo === "tap") return { id: "room", chapter: 1, progress: 0 };
  if (demo !== "register") return tourFrame(time);
  let cursor =
    ((time % registrationDuration) + registrationDuration) %
    registrationDuration;
  for (const scene of registrationScenes) {
    if (cursor < scene.duration)
      return { ...scene, progress: cursor / scene.duration };
    cursor -= scene.duration;
  }
}

// Sweep back and forth so both the color and the visible slider stay continuous.
// Starting at the center immediately shows the effect instead of a slow endpoint.
export function showcaseHue(time) {
  return 179.5 + Math.sin((time / colorSweepDuration) * Math.PI * 2) * 179.5;
}

// The palette marker and preview share the same HSV value throughout the loop.
export function showcaseColor(time) {
  const phase = (time / colorSweepDuration) * Math.PI * 2;
  return {
    h: showcaseHue(time),
    s: 0.62 + Math.sin(phase + Math.PI / 3) * 0.28,
    v: 0.77 + Math.cos(phase * 2) * 0.19,
  };
}

// Finish the move promptly, then keep the selected spot still until confirmation.
export function registrationStampOffset(elapsed) {
  const progress = Math.min(1, Math.max(0, elapsed / 350));
  const eased = 1 - Math.pow(1 - progress, 3);
  return { x: 50 * eased, y: -40 * eased };
}

// Each confirmation lands after the visible action, with 80ms to release before
// the scene changes. The inert demos use the same press state as a real tap.
export function showcasePress(frame) {
  if (
    !["select", "memo", "locate", "map"].includes(frame.id) ||
    !frame.duration
  )
    return false;
  const remaining = frame.duration * (1 - frame.progress);
  return remaining <= 220 && remaining > 80;
}
