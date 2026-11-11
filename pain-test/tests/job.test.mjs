import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../site/pain-test/', import.meta.url);
const source = readFileSync(new URL('assets/app.js', root), 'utf8');
const context = { matchMedia:()=>({matches:true}), document:{getElementById:()=>null} };
vm.runInNewContext(source.split('/* ---------- 이펙트 ---------- */')[0] + `
globalThis.api = {
  seasons:SEASONS, bandOf,
  score:(key,choices)=>{season=key;answers=choices;return compute();}
};`, context);
const {seasons, bandOf, score} = context.api;

test('every job answer path has a matching title, share page and image', () => {
  const outcomes = new Map(), titles = new Set();
  let paths = 0;
  function visit(choices=[]) {
    if (choices.length < 5) {
      seasons.job.qs[choices.length].a.forEach((_,i)=>visit([...choices,i]));
      return;
    }
    paths++;
    const r = score('job',choices);
    assert.ok(Number.isInteger(r.s) && r.s >= 10 && r.s <= 100);
    const title = seasons.job.titles[r.e][bandOf(r.s)][0];
    assert.ok(title);
    titles.add(`${r.e}/${bandOf(r.s)}`);
    outcomes.set(`${r.e}/${r.s}`,r);
  }
  visit();
  assert.equal(paths,3750);
  assert.equal(titles.size,20,'all twenty title bands must be reachable');
  for (const [key,r] of outcomes) {
    const html = readFileSync(new URL(`r/job/${key}/index.html`,root),'utf8');
    assert.ok(html.includes(`https://pheeeew.com/pain-test/r/job/${key}`));
    const image = `og/results-v1-job/job-${r.e}-${r.s}.jpg`;
    assert.ok(html.includes(image));
    assert.ok(existsSync(new URL(image,root)));
    assert.ok(html.includes(seasons.job.titles[r.e][bandOf(r.s)][1]));
  }
});

test('job extremes and emotional weighting stay on the existing scale', () => {
  assert.equal(score('job',[0,0,0,0,0]).s,20);
  const high = score('job',[3,3,4,4,5]);
  assert.equal(high.s,100);
  assert.equal(high.e,'bunno');
  assert.equal(high.pain,'채용공고의 자격요건');
  assert.equal(seasons.job.qs[1].a[3].s,20,'short-video response carries high weight');
  for (const key of ['suneung','company']) {
    assert.equal(score(key,[0,0,0,0,0]).s,key === 'suneung' ? 16 : 18);
    assert.equal(seasons[key].qs.length,5);
  }
});

test('shared job results are accepted by the actual boot route parser', () => {
  const match = source.match(/const path = location\.pathname\.match\((\/.+?\/)\);/);
  assert.ok(match);
  const parser = vm.runInNewContext(match[1]);
  assert.equal(parser.exec('/pain-test/r/job/bunno/100/')[1],'job');
  for (const key of ['suneung','company','love']) assert.equal(parser.exec(`/pain-test/r/${key}/dapdap/50`)[1],key);
  assert.equal(parser.test('/pain-test/r/unknown/bunno/100'),false);
});
