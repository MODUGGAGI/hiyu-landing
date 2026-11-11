import test from 'node:test';
import assert from 'node:assert/strict';
import { pressDemoFrame, collectionCards, filterCollection, collectionDemoFrame, mapDemoFrame } from '../src/showcase-demo.js';

test('slightly negative animation timestamps still resolve valid emotions across loop boundaries', () => {
  for (const time of [-0.5, -1, -6000, -8500, -42501]) {
    const map = mapDemoFrame(time);
    assert.ok(map.emotion?.id);
    assert.deepEqual(map, mapDemoFrame(time + 6000 * 5 * 10));
    const collection = collectionDemoFrame(time);
    assert.deepEqual(collection, collectionDemoFrame(time + 8500 * 5 * 10));
    assert.equal(filterCollection(collection.filter).length, collection.filter === 'all' ? 20 : 4);
  }
});

test('rapid competition presses move me from second to third to second to first and keep first in full rankings', () => {
  assert.equal(pressDemoFrame(0).me.rank, 2);
  assert.equal(pressDemoFrame(1500).me.rank, 3);
  assert.equal(pressDemoFrame(1499).me.rank, 2);
  assert.equal(pressDemoFrame(2474).me.rank, 3);
  assert.equal(pressDemoFrame(2475).me.rank, 2);
  assert.equal(pressDemoFrame(2475).notice, '▲ 1명 추월!');
  assert.equal(pressDemoFrame(3519).me.rank, 2);
  assert.equal(pressDemoFrame(3520).me.rank, 1);
  assert.equal(pressDemoFrame(3520).notice, '▲ 2명 추월!');
  const observedRanks = [];
  for (let time = 0; time < 4800; time += 1) {
    const frame = pressDemoFrame(time);
    if (observedRanks.at(-1) !== frame.me.rank) observedRanks.push(frame.me.rank);
    assert.equal(frame.counts.reduce((sum, count) => sum + count, 0), frame.me.count);
    assert.equal(frame.nearby.length, 3);
    assert.ok(frame.nearby.some(row => row.isMe));
    assert.ok(frame.rows.every((row, i, rows) => i === 0 || rows[i - 1].count >= row.count));
  }
  assert.deepEqual(observedRanks, [2, 3, 2, 1]);
  for (let tap = 1; tap <= 87; tap++) {
    const previous = pressDemoFrame((tap - 1) * 55);
    const next = pressDemoFrame(tap * 55);
    assert.equal(next.me.count, previous.me.count + 1);
    assert.equal(next.counts[next.activeEmotion], previous.counts[next.activeEmotion] + 1);
    for (const row of next.rows) assert.ok(row.count >= previous.rows.find(p => p.id === row.id).count);
  }
  assert.equal(pressDemoFrame(4799).scene, 'press');
  assert.equal(pressDemoFrame(4800).scene, 'ranking');
  assert.equal(pressDemoFrame(5799).scene, 'ranking');
  assert.equal(pressDemoFrame(5800).scene, 'press');
  const ranking = pressDemoFrame(5500);
  assert.equal(ranking.scene, 'ranking');
  assert.equal(ranking.me.rank, 1);
  assert.equal(ranking.taps, 87);
  assert.deepEqual(ranking.rows, pressDemoFrame(4799).rows);
  assert.equal(pressDemoFrame(5800).me.rank, 2);
  assert.equal(pressDemoFrame(5800).taps, 0);
});

test('collection contains twenty distinct artworks, with four cards for each emotion filter', () => {
  assert.equal(collectionCards.length, 20);
  assert.equal(new Set(collectionCards.map(card => card.character)).size, 20);
  assert.equal(new Set(collectionCards.map(card => card.id)).size, 20);
  for (const emotion of ['frustrated', 'irritated', 'exhausted', 'discouraged', 'angry']) {
    const filtered = filterCollection(emotion);
    assert.equal(filtered.length, 4);
    assert.ok(filtered.every(card => card.emotion.id === emotion));
  }
  assert.equal(filterCollection('all').length, 20);
});

test('issued cards switch quickly, show both neighbors and browse the album with flicks and pauses', () => {
  assert.equal(collectionDemoFrame(0).scene, 'coverflow');
  assert.ok(collectionDemoFrame(0).index > 0);
  assert.equal(collectionDemoFrame(700).index, collectionDemoFrame(0).index + 1);
  assert.equal(collectionDemoFrame(3499).scene, 'coverflow');
  assert.equal(collectionDemoFrame(3500).scene, 'album');
  assert.equal(collectionDemoFrame(7300).scene, 'filtered');
  assert.equal(collectionDemoFrame(8500).scene, 'coverflow');
  const progress = elapsed => collectionDemoFrame(3500 + elapsed).albumProgress;
  assert.equal(progress(0), 0);
  assert.equal(progress(900), progress(1000)); // read between flicks
  assert.ok(progress(330) - progress(230) > progress(730) - progress(630)); // momentum slows
  assert.equal(progress(3700), 1);
  let previous = 0;
  for (let t = 0; t < 3800; t += 20) {
    assert.ok(progress(t) >= previous && progress(t) <= 1);
    previous = progress(t);
  }
  for (let cycle = 0; cycle < 5; cycle++) {
    const frame = collectionDemoFrame(cycle * 8500 + 7800);
    assert.equal(filterCollection(frame.filter).length, 4);
    assert.ok(!('canIssue' in frame));
  }
});
