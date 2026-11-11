import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../site/pain-test/assets/app.js',import.meta.url),'utf8');
function api(origin='https://pheeeew.com'){
 const context={URLSearchParams,matchMedia:()=>({matches:true}),document:{getElementById:()=>null},location:new URL(origin)};
 vm.runInNewContext(source.split('/* ---------- 이펙트 ---------- */')[0]+`;globalThis.api={parseSharedBattle,battleCopy,shareName,link:(edition,r,n,vs)=>{season=edition;return resultShareUrl(r,n,vs);}};`,context);
 return context.api;
}
const production=api();
test('battle links restore both scores, emotions and escaped names across all editions',()=>{
 for(const t of ['suneung','company','love','job']){
  const res={s:88,e:'jjajeung',pain:'공부 계획과 현실'},vs={t,s:84,e:'jichim',n:'의지가 안나는'};
  const url=new URL(production.link(t,res,'나 & 너',vs));
  const parsed=production.parseSharedBattle(url.searchParams);
  assert.equal(parsed.t,t);assert.equal(parsed.res.s,88);assert.equal(parsed.res.e,'jjajeung');
  assert.equal(parsed.opponent.s,84);assert.equal(parsed.opponent.e,'jichim');
  assert.equal(parsed.nick,'나 & 너');assert.equal(parsed.opponent.n,'의지가 안나는');
 }
});
test('wins, losses and ties name the actual winner and handle long names',()=>{
 assert.match(production.battleCopy({s:88},{s:84,n:'친구'},'도전자').headline,/도전자/);
 assert.match(production.battleCopy({s:80},{s:84,n:'친구'},'도전자').headline,/친구/);
 assert.equal(production.battleCopy({s:84},{s:84,n:'친구'},'도전자').tie,true);
 assert.equal(Array.from(production.shareName('👑'.repeat(12))).length,8);
});
test('invalid snapshots cannot render out-of-range scores or unknown emotions',()=>{
 const valid='battle=1&t=love&e=bunno&s=88&oe=jichim&os=84';
 for(const [key,value] of [['s','101'],['s','NaN'],['s',''],['s','88.5'],['os','-1'],['e','__proto__'],['oe','<script>'],['t','unknown'],['battle','2']]){
  const p=new URLSearchParams(valid);p.set(key,value);assert.equal(production.parseSharedBattle(p),null,`${key}=${value}`);
 }
 const p=new URLSearchParams(valid);p.set('p','<img src=x onerror=alert(1)>');
 assert.equal(production.parseSharedBattle(p).res.pain,'공유된 배틀 결과');
});
test('ordinary challenge URLs stay compatible, local battle links stay on localhost',()=>{
 const res={e:'jjajeung',s:88};
 assert.equal(production.link('suneung',res,'나'), 'https://pheeeew.com/pain-test/r/suneung/jjajeung/88?v=4&n=%EB%82%98');
 assert.equal(production.parseSharedBattle(new URLSearchParams('t=love&e=bunno&s=88')),null);
 const url=new URL(api('http://127.0.0.1:4182').link('love',res,'나',{e:'jichim',s:84,n:'친구'}));
 assert.equal(url.origin,'http://127.0.0.1:4182');
});
