import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
const root = new URL('../site/pain-test/',import.meta.url);
const source = readFileSync(new URL('assets/app.js',root),'utf8');
const context={matchMedia:()=>({matches:true}),document:{getElementById:()=>null}};
vm.runInNewContext(source.split('/* ---------- 이펙트 ---------- */')[0]+`
globalThis.api={seasons:SEASONS,
 set:(key,choices,index=0)=>{season=key;answers=[...choices];qi=index;},
 live:liveScore,result:compute,back:rewindQuestion,
 answer:ai=>{answers[qi]=ai;answers.length=qi+1;},
 state:()=>({qi,answers})};`,context);
const api=context.api;
for(const [key,edition] of Object.entries(api.seasons)) {
 test(`${key}: every displayed increment equals the running and final score, with valid share assets`,()=>{
  const results=new Set();
  function visit(choices=[],sum=0){
   api.set(key,choices);
   assert.equal(api.live(),sum);
   assert.ok(sum<=100);
   if(choices.length===5){
    const r=api.result();assert.equal(r.s,sum);results.add(`${r.e}/${r.s}`);return;
   }
   for(const [i,a] of edition.qs[choices.length].a.entries()) {
    assert.ok(Number.isInteger(a.s)&&a.s>=2&&a.s<=20);
    visit([...choices,i],sum+a.s);
   }
  }
  visit();
  assert.equal(edition.qs.reduce((n,q)=>n+Math.max(...q.a.map(a=>a.s)),0),100);
  for(const outcome of results){
   const html=readFileSync(new URL(`r/${key}/${outcome}/index.html`,root),'utf8');
   const image=html.match(/property="og:image" content="https:\/\/pheeeew.com\/pain-test\/([^"]+)"/)[1];
   assert.ok(existsSync(new URL(image,root)));
  }
 });
 test(`${key}: going back removes the current and later scores before re-answering`,()=>{
  api.set(key,[0,1,2,3],3);api.back();
  assert.equal(api.state().qi,2);assert.equal(api.state().answers.length,2);
  const before=api.live();api.answer(0);
  assert.equal(api.live()-before,edition.qs[2].a[0].s);
  api.back();assert.equal(api.state().qi,1);assert.equal(api.state().answers.length,1);
  api.back();assert.equal(api.live(),0);api.back();assert.equal(api.live(),0);
 });
}

test('distressing situations have a real score floor even for composed reactions',()=>{
 const question=(edition,index)=>api.seasons[edition].qs[index];
 assert.ok(question('suneung',2).a.every(a=>a.s>=8),'an unsolved problem is not a two-point situation');
 assert.ok(question('love',0).a.every(a=>a.s>=16),'all five-hour-wait reactions express distress');
 assert.ok(question('love',2).a.every(a=>a.s>=16),'pretending to be fine is not feeling fine');
 assert.ok(question('job',2).a.every(a=>a.s>=8),'result-mail uncertainty still carries weight');
 assert.ok(question('company',2).a.every(a=>a.s>=6),'three simultaneous requests still create work');
});

test('two points are reserved for explicitly comfortable responses',()=>{
 const comfortable=new Set(['할 만함','공부한 보람 있네!','계획한 만큼 해내는 중','응, 오늘 분량 거의 끝!','노래 들으며 기분 좋게','이번 달에 씀','생각나면 바로 보냄','잘 다녀와~ 재밌게 놀아~','정리해둔 거 있어서 금방 씀','그냥 요즘 하는 거 얘기함','아직은 할 만함']);
 for(const edition of Object.values(api.seasons))for(const q of edition.qs)for(const a of q.a){
  if(a.s===2)assert.ok(comfortable.has(a.t),a.t);
 }
});
