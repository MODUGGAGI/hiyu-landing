import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
const source=await readFile(new URL('../site/pain-test/assets/app.js',import.meta.url),'utf8');
const context={matchMedia:()=>({matches:true}),document:{getElementById:()=>null}};
vm.runInNewContext(source.split('/* ---------- 이펙트 ---------- */')[0]+';globalThis.seasons=SEASONS;',context);
const hash=text=>createHash('sha256').update(text).digest('hex').slice(0,24);
const catalog={};
for(const [edition,s] of Object.entries(context.seasons))for(const q of s.qs){
 const texts=q.a.map(a=>a.t);
 const id=hash(JSON.stringify([edition,q.q,[...texts].sort()]));
 catalog[id]={edition,question:q.q,answers:Object.fromEntries(texts.map(t=>[hash(t),t]))};
}
await writeFile(new URL('../worker/catalog.json',import.meta.url),JSON.stringify(catalog,null,2)+'\n');
console.log(`Generated ${Object.keys(catalog).length} versioned questions; IDs ignore option order and score changes.`);
