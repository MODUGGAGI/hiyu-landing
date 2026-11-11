import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import {
  emotions,
  shapes,
  trimLabel,
  hsvToHex,
  hexToHsv,
  increment,
} from "../src/model.js";
import { pickReaction, reactionWeights } from "../src/tap/emotions.js";
test("stamp text retains up to four Unicode code points, including emoji", () => {
  assert.equal(trimLabel("우리의모임"), "우리의모");
  assert.equal(trimLabel("🙂🙂🙂🙂🙂"), "🙂🙂🙂🙂");
  assert.equal(trimLabel("우\n리\r모임"), "우리모임");
});
test("HSV color picker covers primaries, black, white and round trips the app color", () => {
  assert.equal(hsvToHex(0, 1, 1), "#FF0000");
  assert.equal(hsvToHex(120, 1, 1), "#00FF00");
  assert.equal(hsvToHex(240, 1, 1), "#0000FF");
  assert.equal(hsvToHex(210, 0, 1), "#FFFFFF");
  assert.equal(hsvToHex(210, 1, 0), "#000000");
  for (const hex of ["#00E5B0", "#E8B5C4", "#AFCBDD"]) {
    const { h, s, v } = hexToHsv(hex);
    assert.equal(hsvToHex(h, s, v), hex);
  }
});
test("rapid independent presses retain each emotion count without mutating prior state", () => {
  let counts = {};
  const initial = counts;
  for (let i = 0; i < 200; i++) counts = increment(counts, emotions[i % 5].id);
  assert.deepEqual(initial, {});
  assert.equal(
    Object.values(counts).reduce((a, b) => a + b),
    200,
  );
  for (const e of emotions) assert.equal(counts[e.id], 40);
});
test("every current app shape has usable vector layers and text bounds", () => {
  assert.equal(shapes.length, 10);
  for (const s of shapes) {
    assert.ok(s.w > 0 && s.h > 0);
    assert.ok(s.cx - s.tw / 2 >= 0 && s.cy - s.th / 2 >= 0);
    for (const layer of [
      "backdrop",
      "fill",
      ...(s.overlay ? ["overlay"] : []),
    ]) {
      const url = new URL(
        `../public/assets/group_stamp_${s.id}_${layer}.svg`,
        import.meta.url,
      );
      assert.ok(existsSync(url));
      const text = readFileSync(url, "utf8");
      assert.match(text, /<svg/);
      assert.match(text, /<path/);
      assert.doesNotMatch(text, /<script|<image|<foreignObject/);
    }
  }
});
test("reused reaction categories preserve the app probability distribution", () => {
  assert.deepEqual(reactionWeights, {
    face: 80,
    text: 75,
    emoji: 30,
    plus: 15,
  });
  const e = {
      icon: "/assets/ic_emotion_angry.svg",
      assets: [
        { kind: "text", value: "으아악!!" },
        { kind: "emoji", value: "🔥" },
      ],
    },
    counts = { face: 0, text: 0, emoji: 0, plus: 0 };
  for (let i = 0; i < 200; i++) {
    let n = 0;
    const r = pickReaction(e, () => (n++ === 0 ? i : 0));
    counts[r.kind]++;
  }
  assert.deepEqual(counts, reactionWeights);
});

// The phone keeps a fixed native layout and scales it as one unit on mobile.
test("map records leave the entire draggable stamp region clear", async () => {
  const {
    mapStamps,
    mapEmotionPositions,
    recordingDragBounds: bounds,
  } = await import("../src/model.js");
  for (const width of [350, 352]) {
    for (const height of [690, 710]) {
      const lane = {
        left: width / 2 + bounds.left - 31,
        right: width / 2 + bounds.right + 31,
        top: height * 0.4 + bounds.top - 31,
        bottom: height * 0.4 + bounds.bottom + 31,
      };
      const records = [
        ...mapStamps.map((s) => ({ ...s, radius: 23 })),
        ...mapEmotionPositions.map((p) => ({ ...p, radius: 20 })),
      ];
      for (const record of records) {
        const x = (width * record.x) / 100,
          y = (height * record.y) / 100,
          r = record.radius + 6;
        assert.ok(
          x + r < lane.left ||
            x - r > lane.right ||
            y + r < lane.top ||
            y - r > lane.bottom,
          `record at ${record.x},${record.y} overlaps the stamp drag area`,
        );
      }
    }
  }
  assert.ok(mapStamps.every((stamp) => Array.from(stamp.label).length === 4));
});

test("map stamp artwork keeps four-character labels outlined at high resolution", async () => {
  const { mapStamps } = await import("../src/model.js");
  const wide = new Set(["ticket", "tag", "postage_stamp"]);
  for (const stamp of mapStamps) {
    assert.equal(stamp.labelLines.join(""), stamp.label);
    assert.deepEqual(
      stamp.labelLines.map((line) => Array.from(line).length),
      wide.has(stamp.shape.id) ? [4] : [2, 2],
    );
    const directory = new URL("../public/assets/map-stamps/", import.meta.url);
    const svg = readFileSync(
      new URL(`${stamp.shape.id}.svg`, directory),
      "utf8",
    );
    assert.ok(svg.includes(`data-stamp-label="${stamp.label}"`));
    assert.ok(svg.includes(`data-line-count="${stamp.labelLines.length}"`));
    assert.doesNotMatch(svg, /<text\b|<foreignObject|<image/);
    const png = readFileSync(new URL(`${stamp.shape.id}.png`, directory));
    assert.equal(png.readUInt32BE(16), 1024);
    assert.ok(png.readUInt32BE(20) >= 500);
  }
});
