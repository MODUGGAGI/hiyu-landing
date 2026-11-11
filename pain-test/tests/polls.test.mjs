import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import vm from 'node:vm';
const require=createRequire(process.env.HIYU_WORKER_MODULES ? `${process.env.HIYU_WORKER_MODULES}/wrangler/package.json` : import.meta.url);
const {Miniflare,convertV4MiniflareOptions}=require('miniflare'),{build}=require('esbuild');
const catalog=JSON.parse(readFileSync(new URL('../worker/catalog.json',import.meta.url)));
const bundle=await build({entryPoints:[new URL('../worker/index.js',import.meta.url).pathname],bundle:true,write:false,format:'esm',platform:'browser'});
const script=bundle.outputFiles[0].text;
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script,d1Databases:['POLLS_DB'],compatibilityDate:'2026-10-03'}));
const db=await mf.getD1Database('POLLS_DB');
await db.exec(readFileSync(new URL('../worker/schema.sql',import.meta.url),'utf8').replace(/\n/g,' '));
const ids=Object.keys(catalog),choices=q=>Object.keys(catalog[q].answers);
const send=(body,origin='https://poll.test')=>mf.dispatchFetch('https://poll.test/pain-test/api/vote',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
const payload=(q,extra={})=>({question:q,answer:choices(q)[0],token:randomUUID(),revision:Date.now(),...extra});
try{
 await test('votes aggregate, retries do not add votes, changes move one vote, stale retries cannot undo it',async()=>{
  const q=ids[0], a=choices(q),v=payload(q,{revision:Date.now()-100});
  let r=await send(v);assert.equal(r.status,200);assert.equal((await r.json()).total,1);
  r=await send(v);assert.equal((await r.json()).total,1);
  await send({...v,answer:a[1],revision:v.revision+10});
  r=await send({...v,revision:v.revision+5});let data=await r.json();
  assert.equal(data.total,1);assert.equal(data.answers.find(x=>x.id===a[1]).count,1);
  await send({...v,answer:a[1],revision:v.revision+20});
  data=await (await send({...v,revision:v.revision+15})).json();
  assert.equal(data.answers.find(x=>x.id===a[1]).count,1);
  await send(payload(q,{answer:a[0]}));data=await (await send(payload(q,{answer:a[2]}))).json();
  assert.equal(data.total,3);assert.equal(data.answers.reduce((n,a)=>n+a.percent,0),100);
  assert.deepEqual(data.answers.filter(x=>x.count).map(x=>x.percent).sort(),[33,33,34]);
 });
 await test('concurrent votes are atomic, verification responses remain separate',async()=>{
  const q=ids[1],v=payload(q);
  await Promise.all(Array.from({length:8},()=>send(v)));
  let data=await (await send(v)).json();assert.equal(data.total,1);
  data=await (await send({...v,test:true})).json();assert.equal(data.total,1);
  data=await (await send(payload(q,{test:true}))).json();assert.equal(data.total,2);
  data=await (await send(v)).json();assert.equal(data.total,1);
 });
 await test('invalid questions, choices, bodies, cross-origin posts and methods are rejected',async()=>{
  const good=payload(ids[2]);
  for(const change of [{question:'__proto__'},{question:'unknown'},{answer:'unknown'},{token:'bad'},{revision:-1},{test:'false'}])assert.equal((await send({...good,...change})).status,400);
  assert.equal((await send(good,'https://unrelated.test')).status,403);
  assert.equal((await send({...good,padding:'x'.repeat(3000)})).status,413);
  assert.equal((await mf.dispatchFetch('https://poll.test/pain-test/api/vote')).status,405);
 });
 await test('catalog IDs match the actual browser algorithm and all four editions',async()=>{
  const source=readFileSync(new URL('../site/pain-test/assets/app.js',import.meta.url),'utf8');
  const context={matchMedia:()=>({matches:true}),document:{getElementById:()=>null},crypto:globalThis.crypto,TextEncoder};
  vm.runInNewContext(source.split('/* ---------- 이펙트 ---------- */')[0]+';globalThis.api={seasons:SEASONS,pollHash};',context);
  const {seasons,pollHash}=context.api;assert.equal(ids.length,20);
  for(const [key,s] of Object.entries(seasons))for(const q of s.qs){
   const names=q.a.map(a=>a.t),id=await pollHash(JSON.stringify([key,q.q,[...names].sort()]));
   assert.ok(catalog[id]);
   for(const name of names)assert.equal(catalog[id].answers[await pollHash(name)],name);
  }
 });
 await test('database outage returns a bounded error rather than invalid percentages',async()=>{
  const broken=new Miniflare(convertV4MiniflareOptions({modules:true,script,compatibilityDate:'2026-10-03'}));
  try{const r=await broken.dispatchFetch('https://poll.test/pain-test/api/vote',{method:'POST',headers:{Origin:'https://poll.test','Content-Type':'application/json'},body:JSON.stringify(payload(ids[3]))});assert.equal(r.status,503);}finally{await broken.dispose();}
 });
}finally{await mf.dispose();}
