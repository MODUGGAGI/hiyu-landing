import React, { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { collectionCards, collectionDemoFrame, filterCollection } from './showcase-demo.js';
import { emotions } from './model.js';
import AppNav from './AppNav.jsx';

const emotionColors = ['#F6BBAA', '#F0BFD0', '#B6A1DC', '#BBD9E9', '#EAA397'];
const colorOf = emotion => emotionColors[emotions.findIndex(e => e.id === emotion.id)];
function CardFrame({ emotion, children, className = '', id }) {
  return <div className={`collection-card-shell ${className}`} data-card-id={id} style={{ '--card-emotion': colorOf(emotion) }}>
    <div className="collection-card">{children}</div>
    {[0, 1, 2, 3].map(i => <span aria-hidden="true" className={`card-corner corner-${i}`} key={i} />)}
  </div>;
}
function Card({ card }) {
  return <CardFrame emotion={card.emotion} id={card.id}>
    <header><img src="/assets/app-v2/ic_bubble_icon.png" alt="" /><b>히유</b><time>{card.date}</time></header>
    <h4><span>{card.title}</span></h4>
    <div className="card-illustration"><img className="card-character" src={card.character} alt={`${card.emotion.name} 캐릭터`} draggable="false" /><img className="card-headline" src={card.headline} alt="" draggable="false" /><img className="card-seal" src={card.seal} alt="" draggable="false" /></div>
    <footer><div><span>{card.emotion.name} 프레스</span><strong><b>{card.pressCount}회</b></strong></div><div><span>{card.emotion.name} 스탬프</span><strong><b>{card.recordCount}회</b></strong></div></footer>
  </CardFrame>;
}
export default function CollectionScreen({ time, paused }) {
  const frame = collectionDemoFrame(time);
  const album = frame.scene === 'album' || frame.scene === 'filtered';
  const cards = filterCollection(frame.filter);
  const viewport = useRef(null), grid = useRef(null), flow = useRef(null);
  const [overflow, setOverflow] = useState(0);
  const [geometry, setGeometry] = useState({ width: 305.52, step: 321.6 });
  useLayoutEffect(() => {
    if (album) {
      const measure = () => setOverflow(Math.max(0, grid.current.scrollHeight - viewport.current.clientHeight));
      const observer = new ResizeObserver(measure);
      observer.observe(viewport.current); observer.observe(grid.current); measure();
      return () => observer.disconnect();
    }
    const measure = () => {
      const width = Math.max(0, Math.min(flow.current.clientWidth * .76, (flow.current.clientHeight - 56) * .75));
      // an/dev CollectionScreen.kt: fixed card width + 4% viewport page spacing.
      setGeometry({ width, step: width + flow.current.clientWidth * .04 });
    };
    const observer = new ResizeObserver(measure); observer.observe(flow.current); measure();
    return () => observer.disconnect();
  }, [album, frame.filter]);
  const selectedEmotion = collectionCards[frame.index].emotion;
  return <div className="collection-demo" data-scene={frame.scene}>
    <header className="collection-heading"><h3>나의 감정 컬렉션</h3><p>기분수집가님의 감정 카드</p>
      <div className="collection-toolbar"><span>모은 카드 {collectionCards.length}장</span><div>
        <button aria-pressed={!album}><img src="/assets/app-v2/ic_collection_cover_flow.svg" alt="" />커버플로</button><button aria-pressed={album}><img src="/assets/app-v2/ic_collection_album.svg" alt="" />앨범</button>
      </div></div>
    </header>
    {album ? <>
      <div className="collection-filters"><button aria-pressed={frame.filter === 'all'}>전체</button>{emotions.map(e => <button key={e.id} aria-pressed={frame.filter === e.id}>{e.name} 4</button>)}</div>
      <div className="collection-album-window" ref={viewport}><div className="collection-album-grid" ref={grid} style={{ transform: `translateY(${-overflow * frame.albumProgress}px)` }}>{cards.map(card => <div key={card.id}><Card card={card} /><div className="album-caption"><b style={{ color: colorOf(card.emotion) }}>{card.emotion.name}</b><time>{card.date}</time></div></div>)}</div></div>
    </> : <div className="collection-coverflow">
      <div className="coverflow-main" ref={flow}>
        <div className="coverflow-stage" style={{ height: geometry.width / .75 }}>
          {collectionCards.slice(0, 7).map((card, i) => {
            const distance = i - frame.index;
            return <motion.div key={card.id} className="coverflow-card" initial={false} animate={{ x: distance * geometry.step }} transition={{ duration: paused ? 0 : .28, ease: [0.22, 1, 0.36, 1] }} style={{ width: geometry.width, left: `calc(50% - ${geometry.width / 2}px)`, zIndex: 10 - Math.abs(distance) }}>
              <motion.div initial={false} animate={{ scaleX: distance === 0 ? 1 : .88, scaleY: distance === 0 ? 1 : .9, rotateY: Math.max(-1, Math.min(1, distance)) * 12, opacity: Math.abs(distance) > 1 ? 0 : distance === 0 ? 1 : .65 }} transition={{ duration: paused ? 0 : .28, ease: [0.22, 1, 0.36, 1] }}><Card card={card} /></motion.div>
            </motion.div>;
          })}
        </div>
        <b className="collection-page-label" style={{ color: colorOf(selectedEmotion) }}>{selectedEmotion.name}</b>
        <div className="collection-dots">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ background: i === frame.index ? colorOf(selectedEmotion) : '#E5E5E5', width: i === 6 ? 4 : 6, height: i === 6 ? 4 : 6 }} />)}</div>
      </div>
      <p className="collection-hint">카드를 눌러 저장하거나 공유해보세요</p>
    </div>}
    <AppNav active="collection" />
  </div>;
}
