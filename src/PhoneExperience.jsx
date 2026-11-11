import React, { useEffect, useId, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import MapDemo from './MapDemo.jsx';
import PressScreen from './PressScreen.jsx';
import CollectionScreen from './CollectionScreen.jsx';

// Each phone owns one clock. Offscreen, background and reduced-motion views freeze it.
export default function PhoneExperience({ paused, enabled = true, deviceStyle, demo }) {
  const titleId = useId();
  const device = useRef(null);
  const visible = useInView(device, { amount: 0.2 });
  const [time, setTime] = useState(0);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const running = enabled && visible && pageVisible && !paused;
  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    if (!running) return;
    let frame;
    let last = performance.now();
    const advance = now => {
      // The first RAF timestamp can precede performance.now() captured above.
      setTime(value => value + Math.max(0, Math.min(now - last, 80)));
      last = now;
      frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [running]);
  // A useful static result instead of an unfinished progress screen when motion is reduced.
  const elapsed = paused ? { register: 5000, tap: 4000, collection: 1400 }[demo] : time;
  return <section className="phone-experience" data-demo={demo} aria-labelledby={titleId}>
    <h2 id={titleId} className="sr-only">{{ register: '감정을 지도에 남기기', tap: '프레스 실시간 경쟁과 일일 순위', collection: '다섯 감정의 카드 20장 모아보기' }[demo]} 자동 시연</h2>
    <div className="experience-layout"><div className="phone-stage">
      <motion.div className="device" ref={device} style={deviceStyle}>
        <img className="device-frame" src="/assets/figma/phone-frame.svg" alt="" draggable="false" />
        <div className="device-screen" inert>
          <div className="phone-status" aria-hidden="true"><img src="/assets/figma/phone-status.svg" alt="" /></div>
          <div className="phone-app" data-running={running}>
            {demo === 'register' && <MapDemo time={elapsed} paused={!running} />}
            {demo === 'tap' && <PressScreen time={elapsed} paused={!running} />}
            {demo === 'collection' && <CollectionScreen time={elapsed} paused={!running} />}
          </div>
          <div className="phone-home-indicator" />
        </div>
      </motion.div>
    </div></div>
  </section>;
}
