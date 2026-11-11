import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import MapDemo from './MapDemo.jsx';
import { comparisonPinPositions, displayTimings, mapDisplayFrame, replayDuration } from './map-display-comparison.js';
import './map-display-comparison.css';

function MapPhone({ side, elapsed, run, reducedMotion }) {
  const holder = useRef(null);
  const [scale, setScale] = useState(.65);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(238, entry.contentRect.width) / 380));
    observer.observe(holder.current);
    return () => observer.disconnect();
  }, []);
  const frame = mapDisplayFrame(elapsed, side);
  const timing = displayTimings[side];
  const sentComplete = frame.sent.length === timing.totalSends;
  const renderState = frame.complete ? 'complete' : frame.sent.length ? 'drawing' : 'waiting';
  return <section className="map-display-phone" data-side={side} data-pin-count={frame.count}>
    <h5>{side === 'before' ? '개선 전' : '개선 후'}<span>{side === 'before' ? '페이지마다 누적 전달' : '첫 핀 즉시 · 후속 갱신 병합'}</span></h5>
    <div className="map-display-phone-row">
    <div ref={holder} className="map-display-phone-space">
      <div className="phone-experience" data-demo="display-comparison" style={{ '--phone-scale': scale }}>
        <div className="device" role="img" aria-label={`${side === 'before' ? '개선 전' : '개선 후'} 지도 ${frame.complete ? '전체 핀 표시 완료' : frame.first ? '첫 핀 표시 후 채우는 중' : '첫 핀 표시 대기 중'}`}>
          <img className="device-frame" src="/assets/figma/phone-frame.svg" alt="" draggable="false" />
          <div className="device-screen" inert>
            <div className="phone-status" aria-hidden="true"><img src="/assets/figma/phone-status.svg" alt="" /></div>
            <div className="phone-app"><MapDemo key={run} time={0} paused={reducedMotion} comparisonPins={comparisonPinPositions.slice(0, frame.count)} /></div>
            <div className="phone-home-indicator" />
          </div>
        </div>
      </div>
    </div>
    <div className="map-display-telemetry">
    <div className="map-display-sends"><span>데이터 전달{sentComplete && <b className="map-display-sent-done">완료</b>}</span><strong>{frame.sent.length}<small> / {timing.totalSends}회</small></strong></div>
    <div className="map-display-send-track" role="img" aria-label={`지도 source 전달 ${frame.sent.length}회 / 총 ${timing.totalSends}회. 누적 전달 항목 수는 설명용 예시입니다.`}>{Array.from({ length: timing.totalSends }, (_, i) => <span key={i} data-hit={i < frame.sent.length} title={frame.sent[i] ? `누적 ${frame.sent[i].toLocaleString('en-US')}개 전달` : '전달 대기'} />)}</div>
    <div className="map-display-render" data-state={renderState}>
      <div className="map-display-render-heading"><span>화면 표시</span><strong>{frame.complete ? '전체 표시 완료' : frame.sent.length ? '화면에 그리는 중' : '데이터 전달 대기'}</strong></div>
      <div className="map-display-render-track" role="img" aria-label={`${frame.complete ? '전체 핀 표시 완료' : frame.sent.length ? '지도 엔진이 화면에 그리는 중. 진행률을 나타내는 막대가 아닙니다.' : '지도에 데이터가 전달되기를 기다리는 중'}`}><span /></div>
      <p>{frame.complete ? '같은 핀 모두 표시' : sentComplete ? '전달 완료 · 표시 중' : frame.first ? '첫 핀 표시 · 나머지 처리 중' : frame.sent.length ? '지도 엔진 처리 중' : '재생하면 시작돼요'}</p>
    </div>
    </div>
    </div>
  </section>;
}

export default function MapDisplayComparison() {
  const [elapsed, setElapsed] = useState(0);
  const [run, setRun] = useState(0);
  const animation = useRef(0);
  const reducedMotion = useReducedMotion();
  useEffect(() => () => cancelAnimationFrame(animation.current), []);
  const start = () => {
    cancelAnimationFrame(animation.current);
    setRun(value => value + 1);
    setElapsed(0);
    const started = performance.now();
    let lastPublished = 0;
    const tick = now => {
      const next = Math.min(replayDuration, now - started);
      if (next - lastPublished >= 32 || next === replayDuration) {
        setElapsed(next);
        lastPublished = next;
      }
      if (next < replayDuration) animation.current = requestAnimationFrame(tick);
    };
    animation.current = requestAnimationFrame(tick);
  };
  const complete = elapsed >= replayDuration;
  return <div className="map-display-comparison" data-playing={Boolean(run && !complete)}>
    <div className="map-display-body">
    <div className="map-display-controls">
      <div className="map-display-intro"><strong>첫 감정은 <span>얼마나 먼저 보일까요?</span></strong><p>고정 핀 1,600개 · 200개씩 8페이지</p></div>
      <button type="button" onClick={start}><span aria-hidden="true">{run && !complete ? '↻' : '▶'}</span> {run ? complete ? '다시 비교하기' : '처음부터 다시 비교' : '동시에 조회 시작'}</button>
    <div className="map-display-playback">
      <div className="map-display-clock"><span>{complete ? '비교 완료' : run ? '비교 재생 중' : '버튼을 눌러 비교해보세요'}</span><strong>{(elapsed / 1000).toFixed(2)}<small> / 5초</small></strong></div>
      <div className="map-display-progress" role="progressbar" aria-label="비교 재생" aria-valuenow={Math.round(elapsed / replayDuration * 100)} aria-valuemin={0} aria-valuemax={100}><span style={{ transform: `scaleX(${elapsed / replayDuration})` }} /></div>
      <table className="map-display-results">
        <caption>화면 표시 시점 <span>측정 중앙값 · ms</span></caption>
        <thead><tr><th scope="col">표시 단계</th><th scope="col">개선 전</th><th scope="col">개선 후</th></tr></thead>
        <tbody>{[['first', '첫 핀 표시'], ['complete', '전체 핀 표시']].map(([key, label]) => <tr key={key}><th scope="row">{label}</th>{['before', 'after'].map(side => {
          const reached = mapDisplayFrame(elapsed, side)[key];
          return <td key={side} data-hit={reached}>{reached ? <><span className="map-display-result-number">{displayTimings[side][key].toLocaleString('en-US')}</span><small> ms</small></> : '—'}</td>;
        })}</tr>)}</tbody>
      </table>
      <p className="map-display-note">측정 중앙값의 시간 비율을 유지해 전체 5초로 재생합니다.<br />중간 핀 표시와 전달 순서는 설명용 예시입니다.</p>
    </div>
    </div>
    <div className="map-display-layout">
      <div className="map-display-phones">
        <MapPhone side="before" elapsed={elapsed} run={run} reducedMotion={reducedMotion} />
        <MapPhone side="after" elapsed={elapsed} run={run} reducedMotion={reducedMotion} />
      </div>
    </div>
    </div>
    <span className="sr-only" role="status">{complete ? '비교 완료. 같은 핀을 모두 표시했습니다. 개선 전 전달 8회 개선 후 전달 3회.' : run ? '동일한 시간축에서 비교 재생 중' : '동시에 조회 시작 버튼으로 비교할 수 있습니다.'}</span>
  </div>;
}
