import test from "node:test";
import assert from "node:assert/strict";
import { pressRankingRows, rankingDemoFrame, rankingFilters, rankingGroupStamp, stampRankingRows } from "../src/ranking-demo.js";

test("ranking demo changes category every second and advances one filter per press visit", () => {
  assert.equal(rankingDemoFrame(0).tab, "stamp");
  assert.equal(rankingDemoFrame(999).tab, "stamp");
  assert.equal(rankingDemoFrame(1000).tab, "press");
  assert.equal(rankingDemoFrame(1999).tab, "press");
  assert.equal(rankingDemoFrame(2000).tab, "stamp");
  rankingFilters.forEach((filter, index) => {
    const start = index * 2000 + 1000;
    const frame = rankingDemoFrame(start);
    assert.equal(frame.tab, "press");
    assert.equal(frame.filter, filter.id);
    assert.deepEqual(rankingDemoFrame(start + 999), frame);
  });
  assert.equal(rankingDemoFrame(12000).tab, "stamp");
  assert.equal(rankingDemoFrame(13000).filter, "all");
});

test("all-emotion sample totals add per-emotion counts and assign consecutive ranks", () => {
  const all = pressRankingRows("all");
  assert.equal(all.find((group) => group.name === "숨고르기").count, 1473);
  assert.equal(all.find((group) => group.name === "히유 클럽").count, 1800);
  assert.deepEqual(all.map((group) => group.rank), Array.from({ length: all.length }, (_, index) => index + 1));
  assert.equal(pressRankingRows("irritated").some((group) => group.isMyGroup), false);
});

test("group stamp identity stays consistent as ranks and filters change", () => {
  const rows = [...stampRankingRows, ...rankingFilters.flatMap((filter) => pressRankingRows(filter.id))];
  const identities = new Map();
  for (const row of rows) {
    assert.ok(row.stamp.shape);
    assert.ok([2, 4].includes(Array.from(row.stamp.label).length));
    assert.deepEqual(row.stamp, rankingGroupStamp(row.name));
    if (identities.has(row.name)) assert.deepEqual(row.stamp, identities.get(row.name));
    identities.set(row.name, row.stamp);
  }
  assert.ok(new Set([...identities.values()].map((stamp) => stamp.shape.id)).size >= 8);
  assert.ok(new Set([...identities.values()].map((stamp) => stamp.fill)).size >= 8);
});

test("stamp and every press filter share the complete fictional group catalog", () => {
  const expected = ["월요일 생존단", "퇴근이 필요해", "히유 클럽", "숨고르기", "야근 탈출단", "천천히 괜찮아", "오늘도 버텨", "고요한 오후", "내일은 덜 바쁘길", "한숨 충전소"].sort();
  assert.deepEqual(stampRankingRows.map((group) => group.name).sort(), expected);
  for (const filter of rankingFilters) {
    const groups = pressRankingRows(filter.id);
    assert.deepEqual(groups.map((group) => group.name).sort(), expected);
    for (const group of groups) {
      assert.doesNotMatch(`${group.name} ${group.stamp.label}`, /우테코|\d+기|별터|모스|허닛|어셔|스타크|지민|수빈/);
    }
  }
});
