import test from 'node:test';
import assert from 'node:assert/strict';
import { comparisonPinPositions, displayTimings, mapDisplayFrame, measuredDuration, replayDuration } from '../src/map-display-comparison.js';

const at = (measured, side) => mapDisplayFrame(measured / measuredDuration * replayDuration, side);

test('both measured first/complete endpoints retain their relative times in the five-second replay', () => {
  for (const side of ['before', 'after']) {
    const { first, complete } = displayTimings[side];
    assert.equal(at(first - .01, side).count, 0);
    assert.equal(at(first + .01, side).count, 2);
    assert.equal(at(complete - .01, side).complete, false);
    assert.equal(at(complete + .01, side).complete, true);
  }
  assert.equal(replayDuration, 5000);
});

test('intermediate frames grow monotonically and both examples end with the same pins', () => {
  for (const side of ['before', 'after']) {
    let previous = 0;
    for (let elapsed = 0; elapsed <= 5000; elapsed += 10) {
      const { count } = mapDisplayFrame(elapsed, side);
      assert.ok(count >= previous);
      previous = count;
    }
    assert.equal(previous, 16);
  }
  assert.equal(at(700, 'before').count, 0);
  assert.equal(at(700, 'after').count, 8);
  assert.deepEqual(mapDisplayFrame(0, 'after').sent, []);
  assert.equal(mapDisplayFrame(5000, 'before').sent.length, 8);
  assert.deepEqual(mapDisplayFrame(5000, 'after').sent, [200, 800, 1600]);
});

test('the improved illustration shows three batches only after their data has been sent', () => {
  const stages = [];
  let previous = 0;
  for (let elapsed = 0; elapsed <= replayDuration; elapsed += 1) {
    const { count, sent } = mapDisplayFrame(elapsed, 'after');
    assert.ok(count * 100 <= (sent.at(-1) ?? 0));
    if (count !== previous) stages.push(count);
    previous = count;
  }
  assert.deepEqual(stages, [2, 8, 16]);
  assert.equal(at(500, 'after').sent.length, 2);
  assert.equal(at(500, 'after').count, 2);
  assert.equal(at(700, 'after').sent.length, 3);
  assert.equal(at(700, 'after').count, 8);
});

test('successive example pins occupy concentric circles within the same map bounds', () => {
  assert.equal(comparisonPinPositions.length, 16);
  comparisonPinPositions.forEach(([x, y], i) => {
    const expected = i < 2 ? 8 : i < 8 ? 23 : 39;
    assert.ok(Math.abs(Math.hypot(x - 50, y - 50) - expected) < .0001);
    assert.ok(x > 0 && x < 100 && y > 0 && y < 100);
  });
});
