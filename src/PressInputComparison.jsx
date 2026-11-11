import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import PressScreen from './PressScreen.jsx';
import { pressDemoFrame } from './showcase-demo.js';
import './press-input-comparison.css';

const responseDelay = 800;
const initialFrame = pressDemoFrame(0);

function ComparisonPhone({ immediate, count, pending, reducedMotion }) {
  const holder = useRef(null);
  const [scale, setScale] = useState(0.65);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(280, entry.contentRect.width) / 380));
    observer.observe(holder.current);
    return () => observer.disconnect();
  }, []);
  const frame = {
    ...initialFrame,
    counts: initialFrame.counts.map((value, index) => value + (index === 4 ? count : 0)),
    taps: count,
    activeEmotion: 4,
    notice: '',
    // The nearby ranking stays a fixed example; the accepted input count updates below it.
  };
  return <section className="press-compare-phone" data-side={immediate ? 'after' : 'before'} data-visible-count={count}>
    <h5>{immediate ? '개선 후' : '개선 전'}<span>{immediate ? '입력 즉시 반영' : '서버 확인 후 반영'}</span></h5>
    <div ref={holder} className="press-compare-phone-space">
      <div className="phone-experience" data-demo="input-comparison" style={{ '--phone-scale': scale }}>
        <div className="device" role="img" aria-label={`${immediate ? '개선 후' : '개선 전'} 프레스 화면 공통 입력 ${count}회 반영`}>
          <img className="device-frame" src="/assets/figma/phone-frame.svg" alt="" draggable="false" />
          <div className="device-screen" inert>
            <div className="phone-status" aria-hidden="true"><img src="/assets/figma/phone-status.svg" alt="" /></div>
            <div className="phone-app"><PressScreen time={0} paused={reducedMotion} frameOverride={frame} showTouch={false} /></div>
            <div className="phone-home-indicator" />
          </div>
        </div>
      </div>
    </div>
    <div className="press-compare-feedback">
      <strong>{pending ? immediate ? `화면에 ${count}회 바로 반영` : `서버 확인 대기 ${pending}회` : count ? '서버 확인 완료' : '입력을 기다리고 있어요'}</strong>
      <span>{pending ? immediate ? `서버 확인 중 ${pending}회` : `공통 입력 ${count}회 반영` : immediate ? '화면 반영과 서버 확인을 분리' : '화면 반응도 서버 확인 뒤에'}</span>
    </div>
  </section>;
}

export default function PressInputComparison() {
  const [taps, setTaps] = useState(0);
  const [confirmed, setConfirmed] = useState(0);
  const timers = useRef(new Set());
  const reducedMotion = useReducedMotion();
  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);
  const tap = () => {
    setTaps(value => value + 1);
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setConfirmed(value => value + 1);
    }, responseDelay);
    timers.current.add(timer);
  };
  const pending = taps - confirmed;
  return <div className="press-input-comparison">
    <div className="press-compare-layout">
      <div className="press-compare-controls">
        <span className="press-compare-hint">꾹! 연타해봐요!</span>
        <button type="button" className="press-compare-trigger" onClick={tap} aria-label="두 화면에 프레스 입력 한 번 보내기">
          <span className="press-compare-trigger-art"><img src="/assets/app-v2/press_button_silver_base.svg" alt="" /><img src="/assets/app-v2/press_angry_stage_0.png" alt="" /></span>
          <span>꾹! 같이 눌러봐요</span>
        </button>
        <span className="press-compare-total">공통 입력 <b>{taps}</b>회</span>
        <p className="technology-footnote press-compare-note">서버 확인 대기 800ms 가정<br />실기기 측정값 재생 아님</p>
      </div>
      <div className="press-compare-phones">
        <ComparisonPhone count={confirmed} pending={pending} reducedMotion={reducedMotion} />
        <ComparisonPhone immediate count={taps} pending={pending} reducedMotion={reducedMotion} />
      </div>
    </div>
    <span className="sr-only" role="status">{pending ? `공통 입력 ${taps}회 서버 확인 중 ${pending}회` : `공통 입력 ${taps}회 두 화면 모두 확인 완료`}</span>
  </div>;
}
