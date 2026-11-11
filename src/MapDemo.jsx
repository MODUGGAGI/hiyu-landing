import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Face, MapArt } from './components.jsx';
import AppSoapBubble from './AppSoapBubble.jsx';
import AppNav from './AppNav.jsx';
import { emotions } from './model.js';
import { mapDemoFrame } from './showcase-demo.js';

// Fixed irregular scatter: no rows or repeating emotion order.
const markerPositions = [
  [80.5, 55.1, 3],
  [54.1, 64.8, 4],
  [8.6, 44.0, 0],
  [15.4, 19.3, 0],
  [76.2, 20.3, 1],
  [50.3, 46.2, 3],
  [55.6, 88.1, 2],
  [20.7, 82.2, 1],
  [35.5, 40.9, 4],
  [58.9, 28.9, 2],
  [38.2, 75.3, 2],
  [85.5, 75.9, 0],
  [27.8, 18.6, 1],
  [92.9, 41.2, 4],
  [50.9, 9.8, 1],
  [68.8, 52.7, 3],
  [23.9, 58.9, 0],
  [79.4, 92.0, 3],
  [8.3, 3.2, 4],
  [7.8, 83.0, 2],
];
function MapControl({ icon, label, className = '' }) {
  return <button type="button" className={`map-control ${className}`} aria-label={label}>
    <span aria-hidden="true" className={`map-control-glyph ${icon === 'ic_map_filter' ? 'original-color' : ''}`} style={{ '--map-icon': `url('/assets/app-v2/map/${icon}.svg')` }} />
  </button>;
}
const phrases = ['답답한', '짜증난', '지친', '좌절한', '분노한'];
const prompts = ['아, 속 터져… 왜저래 진짜', '에잇! 짜증나!!', '아무것도 하기 싫다…', '오늘도 왜 나만 힘들지!?', '아아아아악!!!!!!'];
const memo = '오늘도 잘 버텼다. 이제 잠깐 쉬어가자!';
// EmotionBubbleCluster.kt: the same five faces travel between the bubble and the row.
const collapsedOffsets = [[127, 180], [156, 173], [185, 180], [141, 207], [171, 207]];
function MapEmotionPicker({ expanded, pressing, emotion, paused }) {
  const bubblePressed = !expanded && pressing;
  const spring = { type: 'spring', stiffness: 527.7778, damping: 25 };
  return <div className={`app-bubble-cluster native-emotion-picker ${expanded ? 'expanded' : ''}`}>
    <motion.span className="app-bubble-prompt" initial={false} animate={{ y: expanded ? -90 : 0 }} transition={paused ? {duration: 0} : { type: 'spring', stiffness: 380, damping: 32 }}>
      {expanded ? '지금 감정이 어때요?' : '터치해서 감정을 꺼내보세요'}
    </motion.span>
    {expanded && !paused && <motion.span className="map-bubble-ripple" initial={{ scale: .72, opacity: .39 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ duration: .52, ease: [0, 0, .58, 1] }} />}
    <button className="app-soap" aria-label={expanded ? '감정 다시 담기' : '비눗방울 눌러 감정 꺼내기'}>
      <motion.span className="app-soap-surface" initial={false} animate={{ scaleX: bubblePressed ? 1.13 : 1, scaleY: bubblePressed ? .82 : 1, y: bubblePressed ? 9 : 0 }} transition={paused ? {duration: 0} : bubblePressed ? {duration: .065, ease: [0, 0, .58, 1]} : {type: 'spring', stiffness: 861.5385, damping: 26.15}}>
        <AppSoapBubble className="app-soap-art" />
        <motion.span className="native-soap-close" initial={false} animate={{opacity: expanded ? 1 : 0, scale: expanded ? 1 : .6}} transition={{duration: paused ? 0 : .15}} />
      </motion.span>
    </button>
    {emotions.map((item, i) => <motion.div key={item.id} className="native-emotion-choice" initial={false} animate={{x: expanded ? 12 + i * 64 : collapsedOffsets[i][0], y: expanded ? 49 : collapsedOffsets[i][1] + (bubblePressed ? 4 : 0)}} transition={paused ? {duration: 0} : {...spring, delay: expanded ? .075 + i * .065 : (4-i) * .018}}>
      <motion.button aria-label={`${item.name} 감정 선택`} tabIndex={expanded ? 0 : -1} initial={false} animate={{scale: (expanded ? 1 : 32/60) * (expanded && pressing && item.id === emotion.id ? .86 : 1), rotate: expanded ? 0 : -3}} transition={paused ? {duration: 0} : spring}><Face emotion={item} source="app" /></motion.button>
      <motion.span initial={false} animate={{opacity: expanded ? 1 : 0}} transition={{duration: paused ? 0 : .14, delay: expanded && !paused ? .24 + i * .055 : 0}}>{item.name}</motion.span>
    </motion.div>)}
  </div>;
}
export default function MapDemo({ time, paused, comparisonPins }) {
  const { scene, progress, emotion, pressing } = comparisonPins
    ? { scene: 'browse', progress: 0, emotion: emotions[0], pressing: false }
    : mapDemoFrame(time);
  const move = Math.min(1, progress * 3);
  const offset = scene === 'locate' ? 1 - (1 - move) ** 3 : 1;
  const text = memo.slice(0, Math.ceil(progress * memo.length * 1.6));
  return <div className="map-demo" data-scene={scene}>
    <div className="app-map">
      <MapArt />
      {scene !== 'locate' && <>
        <div className="app-map-top"><button type="button" className="app-settings" aria-label="설정"><img src="/assets/app-v2/map/ic_settings.svg" alt="" /></button><button type="button" className="app-nearby"><img src="/assets/app-v2/map/ic_menu.svg" alt="" />감정 목록</button></div>
        {scene !== 'select' && <><div className="map-top-controls"><MapControl icon="ic_map_filter" label="감정 필터" /><MapControl icon="ic_refresh" label="새로고침" className="map-refresh" /></div><MapControl icon="ic_my_location" label="현재 위치" className="map-location-control" /></>}
      </>}
      <span className="app-location" />
      <div className="map-existing-records">{comparisonPins
        ? comparisonPins.map(([x, y, emotionIndex], i) => <motion.span key={i} className="app-map-marker" initial={paused ? false : { left: '50%', top: '50%', scale: .72 }} animate={{ left: `${x}%`, top: `${y}%`, scale: 1 }} style={{ x: '-50%', y: '-50%' }} transition={{ duration: paused ? 0 : .24, ease: [.2, 0, .2, 1] }}><Face emotion={emotions[emotionIndex]} source="app" /></motion.span>)
        : markerPositions.map(([x, y, emotionIndex], i) => <span key={i} className="app-map-marker" style={{ left: `${x}%`, top: `${y}%` }}><Face emotion={emotions[emotionIndex]} source="app" /></span>)}</div>
      {scene === 'map' && <>
        <span className="map-recorded-face just-registered" style={{ left: 'calc(50% + 30px)', top: 'calc(40% - 60px)' }}><Face emotion={emotion} source="app" /></span>
        <div className="app-registration-notice"><img src="/assets/figma/registration-snackbar.svg" alt="선택한 위치에 감정을 남겼어요" /></div>
      </>}
      {scene !== 'locate' && <MapEmotionPicker expanded={scene === 'select'} pressing={pressing} emotion={emotion} paused={paused} />}
      {scene === 'locate' && <>
        <div className="app-locate-top"><div className="app-top"><button aria-label="뒤로"><img src="/assets/app-v2/map/ic_arrow_back.svg" alt="" /></button><strong>스탬프를 눌러서 옮겨주세요</strong></div><p>내 위치에서 500m 내에서 찍을 수 있어요.</p></div>
        <div className="app-record-radius" />
        <div className="app-drag-stamp" style={{ transform: `translate(${offset * 50}px, ${offset * -40}px)` }}><Face emotion={emotion} source="app" /><span className="app-drag-guide"><img src="/assets/record_stamp_drag_guide.svg" alt="" />끌어서 이동</span></div>
        <MapControl icon="ic_my_location" label="현재 위치" className="map-location-control locate-location-control" /><div className="app-sheet locate-sheet"><span className="sheet-handle" /><h3>이 위치에 감정을 남길까요?</h3><button className="app-primary app-raised" data-pressed={pressing}><span className="app-button-content">여기에 남기기</span></button></div>
      </>}
    </div>
    {scene !== 'locate' && <AppNav active="map" />}
    <AnimatePresence>
      {scene === 'memo' && <motion.div className="app-overlay record-overlay" initial={{ opacity: paused ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: paused ? 0 : 0.16 }}>
        <motion.div className="app-sheet memo-sheet" initial={{ y: paused ? 0 : '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: paused ? 0 : 0.16 }}>
          <span className="sheet-handle" /><div className="app-record-heading"><Face emotion={emotion} source="app" /><strong>{phrases[emotions.indexOf(emotion)]} 감정<br />{prompts[emotions.indexOf(emotion)]}</strong></div>
          <p className="app-record-help">메모 또는 녹음 중 하나를 선택해주세요.</p>
          <div className="app-record-mode"><div className="app-record-tabs"><span className="app-record-indicator" /><button aria-pressed="true">메모</button><button aria-pressed="false">녹음</button></div><label className="record-anonymous">익명 <input type="checkbox" readOnly checked={false} /></label></div>
          <textarea aria-label="감정 메모" value={text} readOnly /><small className="app-memo-count">{text.length}/50</small>
          <div className="app-sheet-actions"><button className="app-next app-raised" disabled={!text.trim()} data-pressed={pressing}><span className="app-button-content">다음</span></button></div>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  </div>;
}
