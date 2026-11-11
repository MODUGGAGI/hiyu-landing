import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../site/pain-test/', import.meta.url);
const source = readFileSync(new URL('assets/app.js', root), 'utf8');
const context = { matchMedia:()=>({matches:true}), document:{getElementById:()=>null} };
vm.runInNewContext(source.split('/* ---------- 이펙트 ---------- */')[0] + `
globalThis.api = { questions:SEASONS.love.qs, titles:SEASONS.love.titles, bandOf,
  score:choices=>{season='love';answers=choices;return compute();} };`, context);
const {questions, titles, bandOf, score} = context.api;

test('all revised love answer combinations have valid share pages and images', () => {
  let paths = 0, minimum = 100, maximum = 0;
  const outcomes = new Map();
  function visit(choices=[]) {
    if (choices.length < questions.length) {
      questions[choices.length].a.forEach((_,i)=>visit([...choices,i]));
      return;
    }
    paths++;
    const result = score(choices);
    assert.ok(Number.isInteger(result.s) && result.s >= 10 && result.s <= 100);
    assert.ok(titles[result.e][bandOf(result.s)]);
    assert.ok(questions.some(q=>q.tag===result.pain));
    minimum = Math.min(minimum,result.s);
    maximum = Math.max(maximum,result.s);
    outcomes.set(`${result.e}/${result.s}`,result);
  }
  visit();
  assert.equal(questions.length,5);
  assert.equal(paths,3750);
  // Waiting and ex-gift questions have no comfortable response (minimum 16 each).
  assert.equal(minimum,38);
  assert.equal(maximum,100);
  for (const [key,r] of outcomes) {
    const html = readFileSync(new URL(`r/love/${key}/index.html`,root),'utf8');
    assert.ok(html.includes(`https://pheeeew.com/pain-test/r/love/${key}`));
    const image = `og/results-v3/love-${r.e}-${r.s}.jpg`;
    assert.ok(html.includes(image));
    assert.ok(existsSync(new URL(image,root)));
    const title = titles[r.e][bandOf(r.s)][0].replace(/<\/?em>/g,'');
    const decoded = html.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
    assert.ok(decoded.includes(title),key);
  }
});

test('new situations can become the result pain point', () => {
  const gift = score([2,0,0,0,0]);
  assert.equal(gift.pain,'전 애인이 준 선물');
  const trip = score([0,0,4,1,0]);
  assert.equal(trip.pain,'남사친·여사친과 여행');
  assert.equal(trip.e,'bunno');
});
