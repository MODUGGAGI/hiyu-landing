const {test}=require('node:test'),vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const code=fs.readFileSync(__dirname+'/zaraz-participation.html','utf8').replace(/^<script>/,'').replace(/<\/script>\s*$/,'');
function setup({search='',referrer='',session=new Map(),blocked=false,path='/pain-test/'}={}){
 const events=[],storage=new Map(),state={tab:null,line:null,result:null};let click,observe;
 const box={textContent:'',style:{}};
 const document={referrer,querySelector:s=>s.startsWith('.tab')?state.tab:s==='.seasonline'?state.line:s==='.result'?state.result:null,addEventListener:(n,fn)=>click=fn,getElementById:()=>box,body:{appendChild(){}},createElement:()=>box};
 const zaraz={track:(name,props)=>{events.push({name,props:JSON.parse(JSON.stringify(props))});return Promise.resolve()}};
 const context={window:{zaraz},zaraz,document,location:{pathname:path,search},URL,URLSearchParams,Date,Promise,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},sessionStorage:{getItem:k=>{if(blocked)throw Error();return session.get(k)},setItem:(k,v)=>{if(blocked)throw Error();session.set(k,v)}},MutationObserver:class{constructor(fn){observe=fn}observe(){}}};
 vm.runInNewContext(code,context);
 return {events,state,session,observe:()=>observe(),click:(id)=>click({target:{closest:()=>({id,disabled:false,matches:()=>false})}}),repeat:()=>vm.runInNewContext(code,context)};
}
test('four platform links attribute visits, starts and actual completions in all four editions without duplicate base counts',()=>{
 for(const source of ['x','threads','instagram','kakao'])for(const [key,label] of Object.entries({suneung:'시험',company:'회사',love:'연애',job:'취업'})){
  const t=setup({search:'?utm_source='+source+'&utm_medium=social'});t.state.tab={dataset:{k:key}};t.click('start');t.state.line={textContent:label+'판 결과'};t.state.result={};t.observe();t.observe();t.repeat();
  const names=t.events.map(e=>e.name);assert.equal(names.filter(n=>n===label+'_시작횟수').length,1);assert.equal(names.filter(n=>n===label+'_완료횟수').length,1);
  assert.equal(names.filter(n=>n.startsWith('유입_')).length,3);assert(t.events.every(e=>e.props.source===source));
 }
});
test('UTM wins over referrer; exact hosts only; missing evidence stays unknown; arbitrary query values never sent',()=>{
 for(const [search,referrer,expected] of [['?utm_source=threads','https://instagram.com/','threads'],['','https://t.co/abc','x'],['','https://l.instagram.com/','instagram'],['','https://www.threads.com/','threads'],['','https://notinstagram.com/','other'],['','https://instagram.com.evil.example/','other'],['?utm_source=kakaotalk','','kakao'],['','https://sharer.kakao.com/','kakao'],['','https://kakao.com.evil.example/','other'],['','','unknown'],['?utm_source=private-person@example.com','','other'],['?utm_source=__proto__','','other']]){
  const t=setup({search,referrer});assert.equal(t.events[0].props.source,expected);assert.deepEqual(Object.keys(t.events[0].props).sort(),['source','source_method']);
 }
});
test('source survives same-tab navigation, expires after 30 minutes and explicit new links override it',()=>{
 const first=setup({search:'?utm_source=x'});assert.equal(setup({session:first.session,referrer:'https://pheeeew.com/'}).events[0].props.source,'x');
 assert.equal(setup({session:first.session,search:'?utm_source=instagram'}).events[0].props.source,'instagram');
 first.session.set('hiyu_source_v1_live',JSON.stringify({source:'x',method:'utm',at:Date.now()-1800001}));assert.equal(setup({session:first.session}).events[0].props.source,'unknown');
 assert.equal(setup({blocked:true,search:'?utm_source=threads'}).events[0].props.source,'threads');
});
test('verification is isolated; opening shared results does not count as a completion',()=>{
 const t=setup({search:'?utm_source=instagram&stats_test=1'});t.state.line={textContent:'시험판 결과'};t.state.result={};t.observe();assert.equal(t.events.length,1);assert(t.events.every(e=>e.name.startsWith('검증_유입_')));
 assert(t.session.has('hiyu_source_v1_test'));assert(!t.session.has('hiyu_source_v1_live'));
});
