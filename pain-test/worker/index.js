import catalog from './catalog.json';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
export function percentages(ids,rows){
 const counts=Object.fromEntries(ids.map(id=>[id,0]));
 for(const row of rows)if(Object.hasOwn(counts,row.answer_id))counts[row.answer_id]=row.votes;
 const total=Object.values(counts).reduce((a,b)=>a+b,0);
 const parts=ids.map(id=>({id,count:counts[id],percent:total?Math.floor(counts[id]*100/total):0,remainder:total?counts[id]*100%total:0}));
 let left=total?100-parts.reduce((n,p)=>n+p.percent,0):0;
 for(const p of [...parts].sort((a,b)=>b.remainder-a.remainder||a.id.localeCompare(b.id)))if(left-->0)p.percent++;
 return {total,answers:parts.map(({remainder,...p})=>p)};
}
async function vote(request,env){
 if(request.method!=='POST')return json({error:'method_not_allowed'},405);
 const url=new URL(request.url);
 if(request.headers.get('Origin')!==url.origin)return json({error:'origin_not_allowed'},403);
 if(!(request.headers.get('Content-Type')||'').startsWith('application/json'))return json({error:'json_required'},415);
 const reader=request.body?.getReader();if(!reader)return json({error:'invalid_body'},400);
 const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2048){await reader.cancel();return json({error:'body_too_large'},413);}chunks.push(value);}
 let body;try{body=JSON.parse(await new Blob(chunks).text());}catch{return json({error:'invalid_json'},400);}
 const {question,answer,token,revision,test=false}=body||{};
 const q=Object.hasOwn(catalog,question)?catalog[question]:null;
 if(!q||!Object.hasOwn(q.answers,answer)||!/^[-a-f0-9]{36}$/.test(token)||!Number.isSafeInteger(revision)||revision<1||revision>Date.now()+60000||typeof test!=='boolean')return json({error:'invalid_vote'},400);
 const dataset=test?'test':'live';
 // A different random token per question prevents linking answers into a profile.
 const voter=await hash(question+':'+token);
 try{
  const results=await env.POLLS_DB.batch([
   env.POLLS_DB.prepare(`INSERT INTO poll_votes(dataset,question_id,voter_hash,answer_id,revision) VALUES(?,?,?,?,?)
    ON CONFLICT(dataset,question_id,voter_hash) DO UPDATE SET answer_id=excluded.answer_id,revision=excluded.revision
    WHERE excluded.revision>poll_votes.revision `).bind(dataset,question,voter,answer,revision),
   env.POLLS_DB.prepare('SELECT answer_id,votes FROM poll_counts WHERE dataset=? AND question_id=?').bind(dataset,question)
  ]);
  return json({question,...percentages(Object.keys(q.answers),results[1].results)});
 }catch{return json({error:'temporarily_unavailable'},503);}
}
export default {async fetch(request,env){
 const path=new URL(request.url).pathname;
 if(path==='/pain-test/api/vote')return vote(request,env);
 if(path.startsWith('/pain-test/api/'))return json({error:'not_found'},404);
 return env.ASSETS.fetch(request);
}};
