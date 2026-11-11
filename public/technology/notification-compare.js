
(()=>{
const root=document.getElementById('hiyu-notification-restart'),before=root.querySelector('[data-side=before]'),after=root.querySelector('[data-side=after]'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let phase='idle',time=0,frame=0,startTime=0,lastStep='',flights=[];
const pile=(side,name)=>side.querySelector('[data-pile="'+name+'"]');
function clearFlights(){for(const f of flights){f.animation.cancel();f.el.classList.remove('in-flight');f.el.style.removeProperty('transform');f.el.style.removeProperty('transform-origin');}flights=[];}
function fly(side,from,to,duration=700){
 if(reduced.matches)return;
 const origin=pile(side,from),target=pile(side,to),a=origin.getBoundingClientRect(),b=target.getBoundingClientRect();
 // Animate the destination itself, retaining its final layout and bell arrangement.
 target.style.transform='none';target.style.transformOrigin='0 0';
 const base=target.getBoundingClientRect();
 target.classList.add('in-flight');
 const transform=r=>`translate(${r.left-base.left}px,${r.top-base.top}px) scale(${r.width/base.width},${r.height/base.height})`;
 const animation=target.animate([{transform:transform(a)},{transform:transform(b)}],{duration,easing:'cubic-bezier(.35,0,.2,1)',fill:'both'});
 flights.push({el:target,animation});
}
function show(side,name,on){const el=pile(side,name);el.dataset.show=String(on);if(name!=='fcm')el.setAttribute('aria-hidden',String(!on));}
function render(animate=false){
 const playing=phase!=='idle',stored=playing&&time>=1.3,stopped=playing&&time>=2, restarted=playing&&time>=5.4,offline=playing&&time>=4.4&&!restarted,crashing=stopped&&!offline&&!restarted,reading=playing&&time>=6.0,read=playing&&time>=6.7,afterSending=playing&&time>=7.9,afterSent=playing&&time>=8.6;
 const step=!playing?'idle':time<.5?'start':!stored?'saving':!stopped?'saved':crashing?'crashing':offline?'offline':!reading?'restart':!read?'reading':!afterSending?'wait':!afterSent?'sending':'done';
 root.querySelector('.demo').dataset.phase=phase;
 root.querySelector('[data-start]').setAttribute('aria-label',phase==='idle'?'서버 재시작해 보기':'다시 비교하기');
 root.querySelectorAll('[data-step]').forEach(el=>el.dataset.active=String(el.dataset.step===(stopped?(reading?'send':'swap'):'save')));
 for(const side of [before,after]){
  const instance=side.querySelector('.container');
  const status=side.querySelector('[data-server-status]');
  status.textContent=crashing?'서버 오류 발생':offline?'서버 중단':restarted?'서버 복구':'';
  status.dataset.state=crashing?'error':offline?'offline':restarted?'restored':'idle';
  instance.dataset.crashing=String(crashing);instance.dataset.on=String(!offline);instance.setAttribute('aria-hidden',String(offline));
  const sent=side===after&&afterSent;
  side.querySelector('.delivery').dataset.occupied=String(side===after&&afterSending);
  side.querySelector('.delivery').dataset.sent=String(sent);
  side.querySelector('[data-delivery]').textContent=sent?'3건 접수':side===before&&stopped?'기존 예약 없음':'대기';show(side,'fcm',sent);
 }
 show(before,'server',!stopped);
 pile(before,'server').dataset.destroyed=String(stopped);
 pile(before,'server').setAttribute('aria-label','메모리에 보관한 기존 알림 예약 3건');
 before.querySelector('[data-memory-result]').textContent=!stopped?'메모리에 예약 보관':'기존 예약 소실 · 복구 불가';
 show(after,'server',(!playing||time<.5)||(read&&!afterSending));
 after.querySelector('.db-content').dataset.occupied=String(playing&&time>=.5);
 show(after,'db',stored);pile(after,'db').dataset.complete=String(afterSent);
 after.querySelector('[data-db-count]').textContent=stored?'3':'0';
 after.querySelector('[data-db-state]').textContent=afterSent?'처리 완료':read?'선점됨':stored?'기록됨':'기록 전';
 const wire=after.querySelector('.wire');wire.dataset.direction=reading?'up':'down';wire.dataset.active=String(!offline&&(!stopped||reading));
 if(step!==lastStep){
  clearFlights();
  if(animate){if(step==='saving')fly(after,'server','db',800);if(step==='reading')fly(after,'db','server',700);if(step==='sending')fly(after,'server','fcm',700);}
  lastStep=step;
 }
}
function tick(now){time=(now-startTime)/1000;if(time>=8.9){time=8.9;phase='done';render();return;}render(true);frame=requestAnimationFrame(tick);}
function start(){cancelAnimationFrame(frame);clearFlights();phase=reduced.matches?'done':'playing';time=reduced.matches?8.9:0;lastStep='';render();if(phase==='playing'){startTime=performance.now();frame=requestAnimationFrame(tick);}}
root.querySelector('[data-start]').addEventListener('click',start);
reduced.addEventListener('change',event=>{if(event.matches&&phase==='playing'){cancelAnimationFrame(frame);clearFlights();phase='done';time=8.9;render();}});
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);clearFlights();});
document.addEventListener('notification:deactivate',()=>{
 cancelAnimationFrame(frame);clearFlights();phase='idle';time=0;lastStep='';render();
});
let viewportWidth=window.innerWidth;
window.addEventListener('resize',()=>{if(viewportWidth===window.innerWidth)return;viewportWidth=window.innerWidth;if(phase==='playing'){cancelAnimationFrame(frame);clearFlights();phase='done';time=8.9;render();}});
render();
})();
