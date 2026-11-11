import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TapButton, Face } from './components.jsx';
import { emotions } from './model.js';
import { StickerEmitter } from './tap/motion.js';
import { pressDemoFrame } from './showcase-demo.js';
import AppNav from './AppNav.jsx';
import './press.css';

const artworkNames = ['blocked', 'annoyed', 'tired', 'defeated', 'angry'];
export default function PressScreen({ time, paused, frameOverride, showTouch = true }) {
  const frame = frameOverride ?? pressDemoFrame(time);
  const combos = useRef(new Map());
  const layer = useRef(null), emitter = useRef(null), reduced = useRef(paused);
  reduced.current = paused;
  useEffect(() => {
    emitter.current = new StickerEmitter(layer.current, { localCoordinates: true, reducedMotion: () => reduced.current, maxParticles: 84 });
    return () => emitter.current.destroy();
  }, []);
  useEffect(() => { if (paused) emitter.current?.clear(); }, [paused]);
  useEffect(() => { if (frame.scene === 'ranking') emitter.current?.clear(); }, [frame.scene]);
  function tap(emotion, button) {
    const now = performance.now();
    const previous = combos.current.get(emotion.id);
    const combo = previous && now - previous.time < 330 ? Math.min(previous.count + 1, 12) : 1;
    combos.current.set(emotion.id, { time: now, count: combo });
    emitter.current?.emit({ button, pointer: null, combo, emotion: { ...emotion, icon: `/assets/ic_emotion_${emotion.id}.svg`, assets: [...emotion.words.map(value => ({ kind: 'text', value })), ...emotion.emojis.map(value => ({ kind: 'emoji', value }))] } });
  }
  return <div className="press-demo" data-scene={frame.scene}>
    <AnimatePresence initial={false}>
    {frame.scene === 'press' ? <motion.div key="press" className="app-press press-scene" initial={paused ? false : { opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: paused ? 0 : .18 }}>
      <header className="press-heading"><h3>프레스</h3><p>지금의 마음을 가볍게 눌러봐요</p></header>
      <button className="press-ranking-link" data-pressed={frame.openingRanking}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 10h7v13H2zM9 2h7v21H9zM16 14h6v9h-6z" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>전체 순위 보기<svg className="ranking-chevron" viewBox="0 0 8 14" aria-hidden="true"><path d="M1.6 2.1 6.4 7 1.6 11.9" fill="none" stroke="currentColor" strokeWidth="2.5" /></svg></button>
      <div className="press-nearby"><div className="nearby-rows">
        <AnimatePresence initial={false}>
        {frame.nearby.map((row, index) => <motion.div key={row.id} initial={paused ? false : { opacity: 0, x: 24, y: index * 41 }} animate={{ opacity: 1, x: 0, y: index * 41 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: paused ? 0 : .16, ease: [.22, .7, .25, 1] }} className={`nearby-row ${row.isMe ? 'is-me' : ''} ${row.isMe && row.rank === 1 ? 'rank-first' : ''}`}>
          <b className="nearby-medal"><motion.span key={row.rank} initial={paused ? false : { y: -10, scale: .65, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} transition={{ duration: paused ? 0 : .18 }}><RankBadge rank={row.rank} /></motion.span></b>
          <span>{row.isMe ? '나' : row.name}</span><strong>{row.count.toLocaleString('en-US')}회</strong>
        </motion.div>)}
        </AnimatePresence>
      </div><div className="press-activity"><div className="activity-people"><i /><div className="activity-avatars">{emotions.slice(0, 3).map(e => <Face key={e.id} emotion={e} source="app" />)}<span>+21</span></div><strong>24명이 함께 누르는 중</strong></div>{frame.notice && <motion.span className="press-notice" initial={paused ? false : { scale: .7, y: 8 }} animate={{ scale: 1, y: 0 }} transition={{ duration: paused ? 0 : .2 }}>{frame.notice}</motion.span>}</div></div>
      <div className="press-pad-space"><div className="press-pad">{emotions.map((emotion, index) => <div className={`press-pad-item item-${index}`} key={emotion.id}>
        <TapButton rapid faceStage={frame.faceStages[index]} emotion={emotion} onTap={tap} paused={paused} pulse={frame.activeEmotion === index ? frame.taps : 0} artwork={`/assets/app-v2/press_${artworkNames[index]}_stage_${frame.faceStages[index]}.png`} />
        <span>{emotion.name}</span><strong>{frame.counts[index]}</strong>
        {showTouch && !paused && frame.activeEmotion === index && frame.taps > 0 && <span className="auto-touch rapid-touch" key={frame.taps} />}
      </div>)}</div></div>
      <AppNav active="press" />
    </motion.div> : <motion.div key="ranking" className="press-scene" initial={paused ? false : { x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: paused ? 0 : .2 }}><DailyRanking frame={frame} /></motion.div>}
    </AnimatePresence>
    <div className="phone-particles" ref={layer} aria-hidden="true" />
  </div>;
}
function RankBadge({ rank }) {
  return rank <= 3 ? <img src={`/assets/app-v2/press_ranking_medal_${rank}.png`} alt={`${rank}위`} /> : rank;
}
function DailyRanking({ frame }) {
  const content = useRef(null);
  const [compact, setCompact] = useState(false);
  useLayoutEffect(() => {
    const measure = () => setCompact(content.current.clientHeight < 600);
    const observer = new ResizeObserver(measure); observer.observe(content.current); measure();
    return () => observer.disconnect();
  }, []);
  return <div className={`daily-ranking ${compact ? 'compact' : ''}`}>
    <header><button aria-label="뒤로"><img src="/assets/ic_arrow_back.svg" alt="" /></button><h3>일일 랭킹</h3><span /></header>
    <div className="ranking-content" ref={content}>
      <div className="race-banner"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 20V0" stroke="#202323" strokeWidth="1.5" /><path d="M4 1H17L13 5 17 9.6H4Z" fill="#FFE76A" stroke="#202323" /></svg><strong>한 번 누를 때마다 앞으로 한 칸!</strong></div>
      <div className="my-race">
        <div className="my-race-score"><span>오늘 나의 레이스</span><b>{frame.me.rank}위</b><strong>{frame.me.count.toLocaleString('en-US')} 프레스</strong></div>
        {!compact && <div className="my-race-art"><div><img src="/assets/app-v2/press_blocked_stage_0.png" alt="" /></div><b>내 페이스로 달리는 중!</b></div>}
      </div>
      <div className="race-list-heading"><h4>함께 달리는 사람들</h4><time>2026-10-29</time></div>
      <div className="race-columns"><span>순위</span><span>참여자</span><span>레이스</span><span>횟수</span></div>
      <div className="race-list-window"><div className="race-list">{frame.rows.map((row, index) => <div className={`race-row ${row.isMe ? 'is-me' : row.rank <= 3 ? 'is-top' : ''}`} key={row.id}>
        <div className="race-medal"><RankBadge rank={row.rank} /></div>
        <strong className="race-name">{row.isMe ? '나' : row.name}</strong>
        <div className="race-track"><Face source="app" emotion={emotions[index % 3]} style={{ left: `calc((100% - 30px) * ${.25 + Math.sqrt(row.count / frame.rows[0].count) * .45})` }} /></div>
        <b>{row.count.toLocaleString('en-US')}</b>
      </div>)}</div></div>
    </div>
  </div>;
}
