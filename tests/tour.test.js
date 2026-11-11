import test from "node:test";
import assert from "node:assert/strict";
import { hsvToHex } from "../src/model.js";
import {
  tourFrame,
  tourDuration,
  sceneStart,
  tourHue,
  scenes,
  showcaseFrame,
  showcaseHue,
  showcaseColor,
  registrationScenes,
  registrationDuration,
  colorSweepDuration,
  registrationStampOffset,
  showcasePress,
} from "../src/tour.js";
test("automatic tour follows one complete creation, group, recording and map journey", () => {
  assert.deepEqual(
    scenes.map((s) => s.id),
    ["create", "color", "groups", "room", "select", "memo", "locate", "map"],
  );
  for (const scene of scenes) {
    assert.equal(tourFrame(sceneStart(scene.id)).id, scene.id);
    assert.equal(
      tourFrame(sceneStart(scene.id) + scene.duration - 1).id,
      scene.id,
    );
  }
  assert.equal(tourFrame(tourDuration).id, "create");
});
test("color sheet moves visibly and its final color survives into group and map", () => {
  assert.notEqual(
    tourHue({ id: "color", progress: 0.25 }),
    tourHue({ id: "color", progress: 0.75 }),
  );
  for (const id of ["groups", "room", "select", "memo", "locate", "map"])
    assert.equal(tourHue({ id }), tourHue({ id: "color", progress: 1 }));
});

test("color and tapping showcases never leave their feature even after many loops", () => {
  for (const time of [0, 1400, 7900, 33100, 60000, 3600000]) {
    assert.equal(showcaseFrame("stamp", time).id, "color");
    assert.equal(showcaseFrame("tap", time).id, "room");
  }
});

test("recording showcase completes selection, memo, placement and result in under five seconds", () => {
  assert.ok(registrationDuration >= 4000 && registrationDuration <= 5000);
  assert.deepEqual(
    registrationScenes.map((s) => s.id),
    ["select", "memo", "locate", "map"],
  );
  let start = 0;
  for (const scene of registrationScenes) {
    assert.equal(showcaseFrame("register", start).id, scene.id);
    assert.equal(
      showcaseFrame("register", start + scene.duration - 1).id,
      scene.id,
    );
    start += scene.duration;
  }
  assert.equal(showcaseFrame("register", registrationDuration).id, "select");
  assert.equal(
    showcaseFrame("register", registrationDuration * 12 + 1).id,
    "select",
  );
});

test("color sweep covers the hue bar smoothly without a seam or thumb reset", () => {
  const samples = [];
  for (let time = 0; time < colorSweepDuration * 3; time += 16) {
    const hue = showcaseHue(time);
    assert.ok(hue >= 0 && hue <= 359);
    if (samples.length) assert.ok(Math.abs(hue - samples.at(-1)) < 5);
    samples.push(hue);
  }
  assert.ok(Math.max(...samples) - Math.min(...samples) > 355);
  assert.ok(
    Math.abs(
      showcaseHue(colorSweepDuration - 1) - showcaseHue(colorSweepDuration + 1),
    ) < 1,
  );
});

test("palette sweeps saturation and brightness continuously, adding shades even at the same hue", () => {
  const first = showcaseColor(0);
  const opposite = showcaseColor(colorSweepDuration / 2);
  assert.ok(Math.abs(first.h - opposite.h) < 1e-9);
  assert.notEqual(
    hsvToHex(first.h, first.s, first.v),
    hsvToHex(opposite.h, opposite.s, opposite.v),
  );
  const samples = [];
  for (let time = 0; time <= colorSweepDuration * 2; time += 16) {
    const color = showcaseColor(time);
    assert.ok(color.s >= 0 && color.s <= 1);
    assert.ok(color.v >= 0 && color.v <= 1);
    if (samples.length) {
      assert.ok(Math.abs(color.s - samples.at(-1).s) < 0.02);
      assert.ok(Math.abs(color.v - samples.at(-1).v) < 0.02);
    }
    samples.push(color);
  }
  assert.ok(
    Math.max(...samples.map((c) => c.s)) -
      Math.min(...samples.map((c) => c.s)) >
      0.5,
  );
  assert.ok(
    Math.max(...samples.map((c) => c.v)) -
      Math.min(...samples.map((c) => c.v)) >
      0.3,
  );
  const before = showcaseColor(colorSweepDuration - 1);
  const after = showcaseColor(colorSweepDuration + 1);
  assert.ok(Math.abs(before.s - after.s) < 0.002);
  assert.ok(Math.abs(before.v - after.v) < 0.002);
});

test("stamp moves to its final spot within 350ms and holds it through confirmation", () => {
  assert.deepEqual(registrationStampOffset(0), { x: 0, y: -0 });
  assert.deepEqual(registrationStampOffset(350), { x: 50, y: -40 });
  assert.deepEqual(registrationStampOffset(650), { x: 50, y: -40 });
  let previous = 0;
  for (let elapsed = 0; elapsed <= 650; elapsed += 16) {
    const { x, y } = registrationStampOffset(elapsed);
    assert.ok(x >= previous && x <= 50);
    assert.ok(y >= -40 && y <= 0);
    previous = x;
  }
});

test("automatic confirmation presses follow placement and finish release before transition", () => {
  for (const scene of registrationScenes) {
    assert.equal(showcasePress({ ...scene, progress: 0 }), false);
    assert.equal(
      showcasePress({
        ...scene,
        progress: (scene.duration - 219) / scene.duration,
      }),
      true,
    );
    assert.equal(
      showcasePress({
        ...scene,
        progress: (scene.duration - 81) / scene.duration,
      }),
      true,
    );
    assert.equal(
      showcasePress({
        ...scene,
        progress: (scene.duration - 79) / scene.duration,
      }),
      false,
    );
    assert.equal(showcasePress({ ...scene, progress: 1 }), false);
  }
  const locate = registrationScenes.find((scene) => scene.id === "locate");
  assert.ok(
    locate.duration - 220 > 350,
    "placement completes before confirmation press",
  );
  assert.equal(showcasePress(showcaseFrame("stamp", 1400)), false);
  assert.equal(showcasePress(showcaseFrame("tap", 1400)), false);
});
