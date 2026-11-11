import test from "node:test";
import assert from "node:assert/strict";
import { randomInt, randomRange, pick } from "../src/tap/random.js";

test("randomInt includes both integer endpoints and supports the uint32 range", () => {
  assert.equal(
    randomInt(5, () => 0),
    0,
  );
  assert.equal(
    randomInt(5, () => 4),
    4,
  );
  assert.equal(
    randomInt(1, () => 0xffff_ffff),
    0,
  );
  assert.equal(
    randomInt(0x1_0000_0000, () => 0xffff_ffff),
    0xffff_ffff,
  );
});

test("randomInt rejects the incomplete tail instead of biasing the first entries", () => {
  const samples = [0xffff_ffff, 0xffff_fffe, 8];
  let calls = 0;
  assert.equal(
    randomInt(10, () => samples[calls++]),
    8,
  );
  assert.equal(calls, 3);
});

test("each integer has equal representation over a complete source bucket", () => {
  const frequencies = Array(7).fill(0);
  for (let source = 0; source < 7_000; source += 1) {
    frequencies[randomInt(7, () => source)] += 1;
  }
  assert.deepEqual(frequencies, Array(7).fill(1_000));
});

test("pick samples with replacement, including immediate repeats, without mutating the pool", () => {
  const assets = Object.freeze(["아오!!", "😤", "face.svg"]);
  assert.deepEqual(
    Array.from({ length: 4 }, () => pick(assets, () => 1)),
    ["😤", "😤", "😤", "😤"],
  );
  assert.equal(
    pick(assets, () => 2),
    "face.svg",
  );
  assert.deepEqual(assets, ["아오!!", "😤", "face.svg"]);
});

test("randomRange supports negative values, its lower endpoint, and equal endpoints", () => {
  assert.equal(
    randomRange(-12, 12, () => 0),
    -12,
  );
  assert.equal(
    randomRange(-12, 12, () => 0x8000_0000),
    0,
  );
  const nearUpper = randomRange(-12, 12, () => 0xffff_ffff);
  assert.ok(nearUpper > 11.99 && nearUpper < 12);
  assert.equal(
    randomRange(3, 3, () => {
      throw new Error("Should not draw entropy");
    }),
    3,
  );
});

test("invalid ranges and pools fail clearly", () => {
  for (const value of [0, -1, 1.5, NaN, Infinity, 0x1_0000_0001]) {
    assert.throws(() => randomInt(value), RangeError);
  }
  for (const [min, max] of [
    [2, 1],
    [NaN, 1],
    [0, Infinity],
    [-Number.MAX_VALUE, Number.MAX_VALUE],
  ]) {
    assert.throws(() => randomRange(min, max), RangeError);
  }
  assert.throws(() => pick([]), RangeError);
  assert.throws(() => pick("abc"), RangeError);
});

test("invalid entropy cannot silently skew a sample", () => {
  for (const value of [-1, 0.5, 0x1_0000_0000, NaN, Infinity, "2"]) {
    assert.throws(() => randomInt(4, () => value), RangeError);
    assert.throws(() => randomRange(0, 1, () => value), RangeError);
  }
  assert.throws(() => randomInt(2, null), TypeError);
});
