import { createPortal } from 'react-dom';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import './technology.css';
import PerformanceCharts from './PerformanceCharts.jsx';
import { apis, allVersions, resultsFor, summaryFor } from './map-performance.js';
import DataTable from './TechnologyTable.jsx';
import PressTechnologyContent from './PressTechnologyContent.jsx';
import MobileMapTechnologyContent from './MobileMapTechnologyContent.jsx';
import NotificationTechnologyContent from './NotificationTechnologyContent.jsx';

const StablePressContent = React.memo(PressTechnologyContent);
const StableMobileMapContent = React.memo(MobileMapTechnologyContent);
const StableNotificationContent = React.memo(NotificationTechnologyContent);

function ComparisonDemo({ enabled, rate, onRateChange }) {
  const initialRate = useRef(rate);
  const frame = useRef(null);
  const observer = useRef(null);
  const [height, setHeight] = useState(850);
  useEffect(() => () => observer.current?.disconnect(), []);
  useEffect(() => {
    const receiveRate = event => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === 'hiyu-map-rate-change' && [100, 150].includes(event.data.rate)) onRateChange(event.data.rate);
    };
    window.addEventListener('message', receiveRate);
    return () => window.removeEventListener('message', receiveRate);
  }, [onRateChange]);
  const resize = () => {
    observer.current?.disconnect();
    const body = frame.current?.contentDocument?.body;
    if (!body) return;
    const update = () => setHeight(Math.ceil(body.getBoundingClientRect().height) + 2);
    observer.current = new ResizeObserver(update);
    observer.current.observe(body);
    update();
  };
  return <iframe
    ref={frame}
    className="technology-demo"
    src={enabled ? `/technology/map-compare.html?rate=${initialRate.current}` : undefined}
    title="지도 한 번 이동으로 세 가지 조회 방식의 p95 응답시간 비교"
    loading="lazy"
    style={{ height }}
    onLoad={resize}
  />;
}


export default function TechnologySection({ locked }) {
  const [rate, setRate] = useState(100);
  const [activeTopic, setActiveTopic] = useState('map');
  const [notificationVisited, setNotificationVisited] = useState(false);
  const reduceMotion = useReducedMotion();
  const tabsRef = useRef(null);
  const tabsAnchorRef = useRef(null);
  const dockState = useRef(false);
  const dockTransition = useRef(null);
  const scrollToTopicStart = useRef(false);
  const [headerDocked, setHeaderDocked] = useState(false);
  const [indicator, setIndicator] = useState(null);
  useLayoutEffect(() => {
    const tabs = tabsRef.current;
    const selected = tabs.querySelector('[aria-selected="true"]');
    const update = () => setIndicator({ x: selected.offsetLeft, y: selected.offsetTop, width: selected.offsetWidth, height: selected.offsetHeight });
    update();
    const observer = new ResizeObserver(update);
    tabs.querySelectorAll('[role="tab"]').forEach(tab => observer.observe(tab));
    return () => observer.disconnect();
  }, [activeTopic, headerDocked]);
  useLayoutEffect(() => {
    if (!scrollToTopicStart.current) return;
    scrollToTopicStart.current = false;
    const heading = document.querySelector(`#technology-${activeTopic}-panel .technology-heading`);
    const headerHeight = document.querySelector('.story-header').offsetHeight;
    const topInset = headerHeight + 24 + (headerDocked ? 0 : tabsRef.current.offsetHeight + 8);
    window.scrollTo({
      top: window.scrollY + heading.getBoundingClientRect().top - topInset,
      behavior: reduceMotion ? 'instant' : 'smooth',
    });
  }, [activeTopic, headerDocked, reduceMotion]);
  useLayoutEffect(() => {
    const previous = dockTransition.current;
    dockTransition.current = null;
    if (!previous) return;
    const tabs = tabsRef.current;
    const next = tabs.getBoundingClientRect();
    let animation;
    if (!reduceMotion && next.bottom > 0 && next.top < window.innerHeight) {
      animation = tabs.animate([
        { transform: `translate(${previous.rect.left - next.left}px, ${previous.rect.top - next.top}px)` },
        { transform: 'translate(0, 0)' },
      ], { duration: 360, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    }
    if (previous.focusedTab) tabs.querySelector(`#${previous.focusedTab}`)?.focus({ preventScroll: true });
    return () => animation?.cancel();
  }, [headerDocked, reduceMotion]);
  useEffect(() => {
    const updateDock = () => {
      const header = document.querySelector('.story-header');
      const section = document.getElementById('technology');
      const anchor = tabsAnchorRef.current.getBoundingClientRect();
      const brand = header.querySelector('.brand').getBoundingClientRect();
      const menu = header.querySelector('.header-links').getBoundingClientRect();
      const slot = document.getElementById('technology-header-slot');
      slot.style.left = `${anchor.left}px`;
      const active = !locked && window.innerWidth >= 1100
        && brand.right + 8 <= anchor.left
        && anchor.left + tabsRef.current.offsetWidth + 12 <= menu.left
        && anchor.top <= header.offsetHeight + 8
        && section.getBoundingClientRect().bottom > header.offsetHeight + 60;
      if (active !== dockState.current) {
        dockTransition.current = {
          rect: tabsRef.current.getBoundingClientRect(),
          focusedTab: tabsRef.current.contains(document.activeElement) ? document.activeElement.id : null,
        };
        dockState.current = active;
        setHeaderDocked(active);
      }
    };
    updateDock();
    window.addEventListener('scroll', updateDock, { passive: true });
    window.addEventListener('resize', updateDock);
    const observer = new ResizeObserver(updateDock);
    observer.observe(document.getElementById('technology'));
    return () => {
      window.removeEventListener('scroll', updateDock);
      window.removeEventListener('resize', updateDock);
      observer.disconnect();
    };
  }, [locked]);
  const selectTopic = (topic) => {
    if (topic === activeTopic) return;
    if (topic === 'notification') setNotificationVisited(true);
    const heading = document.querySelector(`#technology-${activeTopic}-panel .technology-heading`);
    scrollToTopicStart.current = heading.getBoundingClientRect().top < document.querySelector('.story-header').offsetHeight + 16;
    setActiveTopic(topic);
  };
  const navigateTabs = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const topics = ['map', 'mobile-map', 'press', 'notification'];
    const index = topics.indexOf(activeTopic);
    const topic = event.key === 'Home' ? topics[0] : event.key === 'End' ? topics.at(-1) : topics[(index + (event.key === 'ArrowRight' ? 1 : -1) + topics.length) % topics.length];
    selectTopic(topic);
    event.currentTarget.querySelector(`#technology-${topic}-tab`).focus({ preventScroll: true });
  };
  // Tab selection and indicator movement must not rebuild the hidden map article.
  const mapContent = React.useMemo(() => <>
      <header className="technology-heading">
        <div className="technology-title-row"><h2 id="technology-title">같은 요청량에서도, <br className="technology-title-break" /><mark>지도는 더 빠르게.</mark></h2></div>
        <p>주변의 감정을 살펴보는 순간이 답답하지 않도록.<br />반복 조회와 집계 비용을 줄여 지도 API의 응답시간을 단축했습니다.</p>
      </header>

      <article className="technology-story" aria-labelledby="map-engineering-title">
        <div className="technology-story-top"><span className="technology-tag">BACKEND · 지도 조회 개선</span><h3 id="map-engineering-title">매번 다시 계산하던 지도에서,<br />필요한 결과를 재사용하는 지도로</h3></div>
        <p className="technology-intro">처음에는 지도를 움직일 때마다 화면과 행정구역 경계가 겹치는지 검사하고 선택한 지역 전체의 감정을 집계했습니다.<br />복잡한 해안선과 섬의 경계까지 반복해서 읽으면서 긴 조회 지연과 DB 연결 대기가 관측됐습니다.</p>

        <DataTable caption="반복 작업을 줄인 세 단계" headings={['개선', '이전에는', '이렇게 바꿨어요']} rows={[
          ['01 경계 검사 제거', '화면과 복잡한 지역 경계를 요청마다 비교', '시도·시군구 전국 요약을 전달하고 앱에서 화면 안의 표시점을 선택'],
          ['02 지역 코드 집계', '읍면동에서 부모 지역을 JOIN해 시도·시군구 탐색', '저장된 지역 코드의 앞 2자리·5자리로 바로 묶어 집계'],
          ['03 Caffeine 캐시', '같은 기본 조회에서도 집계와 핀 후보 SQL 반복', '기본 지역 집계와 핀 후보를 JVM 메모리에서 재사용'],
        ]} />

        <div className="technology-demo-heading"><span className="technology-step">직접 비교해 보세요</span><h4>같이 출발해도, 도착은 달라요.</h4><p>공통 지도 위 작은 휴대폰을 끌었다가 놓아 보세요!!<br />세 방식이 동시에 출발하고 응답이 도착한 화면부터 새 지도와 지역 요약을 표시합니다.</p></div>
        <div className="technology-demo-surface"><ComparisonDemo enabled={!locked} rate={rate} onRateChange={setRate} /></div>

        <div className="technology-results-heading"><span className="technology-step">개발 서버에서 확인한 변화 · {rate} RPS</span><h4>같은 요청량에서,<br className="technology-mobile-break" /> 더 짧아진 응답시간.</h4></div>
        <div className="technology-highlights" aria-live="polite">
          <div><strong>{summaryFor(rate).after}<span>ms</span></strong><p>API별 p95 · {summaryFor(rate).before}ms → {summaryFor(rate).after}ms</p></div>
          <div><strong>{summaryFor(rate).reduction}<span>%</span></strong><p>부모 지역 JOIN 대비 API별 p95 감소</p></div>
        </div>
        <p className="technology-footnote">범위는 개별 핀·시도·시군구 API 각각의 p95를 요약한 값입니다.<br />최종 개선(v4)은 Caffeine 적용 이후의 응답 조립 개선 등도 포함합니다. Caffeine만의 효과를 의미하지 않습니다.<br />비교 버전은 모두 시도·시군구 경계 교차 검사를 제거한 이후입니다.</p>
        <PerformanceCharts rate={rate} />
        <details className="technology-numbers"><summary><span className="technology-details-label">기본 Caffeine 결과와 정확한 수치 보기</span><span className="technology-details-toggle" aria-hidden="true">＋</span></summary>
          <DataTable caption={`${rate} RPS · API별 p95 (3회 중앙값)`} headings={['지표', ...allVersions.map(v => v.label)]} rows={apis.map(api => [api.label, ...allVersions.map(v => `${resultsFor(rate)[v.key].p95[api.key].toFixed(2)} ms`)])} numeric />
          <DataTable caption={`${rate} RPS · 요청 실패와 미발송 요청`} headings={['지표', ...allVersions.map(v => v.label)]} rows={[
            ['실패 응답 (3회 합계)', ...allVersions.map(v => `${resultsFor(rate)[v.key].failures}건`)],
            ['미발송 비율 (3회 중 최대)', ...allVersions.map(v => `${resultsFor(rate)[v.key].droppedPercentMax.toFixed(2)}%`)],
          ]} numeric />
          <p className="technology-footnote">150 RPS에서 부모 지역 JOIN 버전은 목표 요청량을 따라가지 못했습니다. 미발송은 실패 응답과 구분합니다.<br />다른 버전의 소량 미발송은 측정 중 CPU steal 구간과 겹쳤으며 최대 처리량의 근거로 사용하지 않았습니다.</p>
        </details>
        <p className="technology-footnote">2026-11-02 · 개발 서버 t4g.small (2 vCPU) · 동일 VPC의 EC2 부하 발생기 · k6 고정 요청률 시험.<br />감정 10,040건 · 핀/시도/시군구 요청 비율 6:2:2 (추정 비율) · 74개 위치 순환 · 핀 첫 페이지만 요청.<br />예열 2분 후 5분 측정 · 조건별 3회 · 실행 순서를 바꾸고 데이터 동일 여부를 확인했습니다.<br />RPS는 세 API의 합산 목표 요청량입니다. 운영 성능이나 최대 처리량을 의미하지 않습니다.</p>

        <details className="technology-details"><summary><span className="technology-details-label">쿼리와 캐시를 선택한 근거 더 보기</span><span className="technology-details-toggle" aria-hidden="true">＋</span></summary>
          <div className="technology-details-body">
            <h4>같은 결과를 더 적은 조회로</h4>
            <p>지역 코드의 형식과 부모 코드 일치를 DB 제약으로 보장한 뒤 불필요한 부모 지역 JOIN을 제거했습니다.<br />36개 조회 조건을 custom·generic 실행 계획에서 비교한 72쌍의 결과가 모두 일치했습니다.</p>
            <DataTable caption="지역 코드 집계 전후의 DB 실행 시간 중앙값" headings={['조회 / 실행 계획', '부모 지역 JOIN', '지역 코드 집계']} rows={[
              ['시도 / custom', '33.492 ms', '8.702 ms'], ['시도 / generic', '35.306 ms', '6.928 ms'], ['시군구 / custom', '18.083 ms', '8.880 ms'], ['시군구 / generic', '19.434 ms', '7.355 ms'],
            ]} numeric />
            <p className="technology-footnote">개발 DB 전체 22,258건 중 기본 조회 대상 10,005건.<br />동일 연결·스냅샷의 읽기 전용 트랜잭션에서 2회 예열 후 5회 측정한 EXPLAIN ANALYZE Execution Time 중앙값입니다.<br />위 HTTP 부하 시험과는 별도 측정입니다.</p>
            <h4>캐시도 비교해서 골랐어요</h4>
            <p>로컬에서 개별 핀 캐시의 세 가지 구조를 비교했습니다.<br />지역 집계는 모두 같은 Caffeine을 사용했습니다.<br />아래 표는 핀 후보 99,990건 조건이며 옅은 노란색 열은 최종 선택한 기존 Caffeine 방식입니다.</p>
            <DataTable caption="핀 후보 99,990건의 로컬 캐시 구조 비교" headings={['지표', 'Caffeine 기존 방식 · 선택', 'Caffeine + 변경 가능한 Map', 'Redis Hash + Sorted Set']} rows={[
              ['핀이 있는 영역 / 조회 p95', '10.81 ms', '12.73 ms', '20.47 ms'], ['빈 영역 / 조회 p95', '12.38 ms', '12.99 ms', '1,609.19 ms'],
            ]} numeric highlightColumn={1} />
            <p>이번 Redis 구현은 빈 영역에서도 시간순 후보를 가져와 화면 범위를 검사했습니다.<br />후보가 늘수록 전송과 역직렬화 비용이 커졌고 조회 응답시간도 두 Caffeine 방식보다 길어 후보에서 제외했습니다.</p>
            <h4>두 Caffeine 방식은 쓰기 비용까지 비교했어요</h4>
            <p>기존 방식은 변경마다 전체 Map을 복사하고 조회에는 게시된 불변 스냅샷을 사용했습니다.<br />변경 가능한 Map 방식은 쓰기 전용 Map의 개별 항목을 바꾸고 게시할 때 조회용 불변 스냅샷을 만들었습니다.<br />조회와 등록·수정·삭제를 병행한 조건에서 두 방식의 쓰기 성능을 비교했습니다.</p>
            <DataTable caption="핀 후보 99,990건에서 두 Caffeine 방식의 쓰기 성능 비교" headings={['측정 구간 · p95', 'Caffeine 기존 방식 · 선택', 'Caffeine + 변경 가능한 Map']} rows={[
              ['DB 커밋 후 핀 캐시 갱신', '10.955 ms', '0.129 ms'],
              ['전체 등록 API', '36.324 ms', '45.204 ms'],
            ]} numeric highlightColumn={1} />
            <p>전체 Map 복사를 줄이자 캐시 갱신 구간은 빨라졌습니다.<br />하지만 이 개선이 전체 등록 API 응답시간의 일관된 개선으로 이어지지는 않았습니다.<br />변경 가능한 Map도 게시 시 전체 스냅샷 복사와 정렬이 필요했고 쓰기 전용 Map을 별도로 관리해야 했습니다.<br />추가 구조로 바꿀 만큼의 전체 API 성능 이점이 없어 구현이 단순한 기존 Caffeine 방식을 유지했습니다.</p>
            <p className="technology-footnote">캐시 갱신 구간과 전체 등록 API는 측정 범위가 다른 지표입니다.<br />옅은 노란색은 각 행의 최솟값이 아니라 최종 선택한 구조를 표시합니다.<br />위 개발 서버 HTTP 부하 시험과는 별도의 로컬 비교입니다.</p>
            <h4>빠르게 읽어도, 변경은 정확하게</h4>
            <DataTable caption="변경 유형별 캐시 반영 규칙" headings={['상황', '처리 방식']} rows={[
              ['새 감정 등록', <>DB 커밋 후 반영하며 첫 변경부터 1초 동안 모아 게시.<br />미게시가 3초를 넘으면 SQL로 대체</>],
              ['수정·일반 삭제', <>새 스냅샷으로 교체한 뒤 성공 응답.<br />성공 후 시작한 조회에 변경 반영</>],
              ['캐시 장애·무효 상태', <>기존 SQL 조회로 전환.<br />재시작 때는 DB에서 캐시 재생성</>],
            ]} />
            <p className="technology-footnote">캐시는 전체 범위·기간 조건이 없는 기본 조회에 적용했습니다.<br />사용자별 차단 정보는 요청마다 반영하며 최종 개선(v4)에서는 응답 조립 시 스탬프 조회를 제거했습니다.<br />재집계와 쓰기의 순서를 맞추고 유효하지 않은 과거 작업이 삭제 전 결과를 다시 게시하지 않도록 확인합니다.</p>
          </div>
        </details>
      </article>
  </>, [locked, rate]);
  const topicTabs = (<div ref={tabsRef} className="technology-tabs" role="tablist" aria-label="기술 소개 주제" onKeyDown={navigateTabs}>
        {indicator && <motion.span className="technology-tab-indicator" initial={false} animate={indicator} transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.4, 0, 0.2, 1] }} aria-hidden="true" />}
        <button type="button" role="tab" id="technology-map-tab" aria-selected={activeTopic === 'map'} tabIndex={activeTopic === 'map' ? 0 : -1} onClick={() => selectTopic('map')} aria-controls="technology-map-panel" className="technology-tab"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M2.8 5.2 7.6 2.8 12.4 5.2 17.2 2.8V14.8L12.4 17.2 7.6 14.8 2.8 17.2Z" fill="white" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M7.6 2.8V14.8M12.4 5.2V17.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>지도 조회 개선</button>
        <button type="button" role="tab" id="technology-mobile-map-tab" aria-selected={activeTopic === 'mobile-map'} tabIndex={activeTopic === 'mobile-map' ? 0 : -1} onClick={() => selectTopic('mobile-map')} aria-controls="technology-mobile-map-panel" className="technology-tab"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M2.8 5.2 7.6 2.8 12.4 5.2 17.2 2.8V14.8L12.4 17.2 7.6 14.8 2.8 17.2Z" fill="white" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M7.6 2.8V14.8M12.4 5.2V17.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>지도 표시 개선</button>
        <button type="button" role="tab" id="technology-press-tab" aria-selected={activeTopic === 'press'} tabIndex={activeTopic === 'press' ? 0 : -1} onClick={() => selectTopic('press')} aria-controls="technology-press-panel" className="technology-tab"><img src="/assets/nav_press.svg" width="20" height="20" alt="" />프레스 반응 개선</button>
        <button type="button" role="tab" id="technology-notification-tab" aria-selected={activeTopic === 'notification'} tabIndex={activeTopic === 'notification' ? 0 : -1} onClick={() => selectTopic('notification')} aria-controls="technology-notification-panel" className="technology-tab"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" fill="white" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 20a3 3 0 0 0 6 0Z" fill="white" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>알림 발송 개선</button>
      </div>);
  return <section id="technology" className="technology-section" inert={locked} aria-labelledby="technology-label">
    <div className="technology-inner">
      <span id="technology-label" className="technology-eyebrow">히유를 만든 기술</span>
      <div ref={tabsAnchorRef} className="technology-tabs-sentinel" aria-hidden="true" />
      <div className="technology-tabs-anchor">
        {headerDocked ? createPortal(topicTabs, document.getElementById('technology-header-slot')) : topicTabs}
      </div>
      <div id="technology-map-panel" hidden={activeTopic !== 'map'} role="tabpanel" aria-labelledby="technology-map-tab">
      {mapContent}
      </div>
      <div id="technology-press-panel" hidden={activeTopic !== 'press'} role="tabpanel" aria-labelledby="technology-press-tab">
        <header className="technology-heading">
          <h2>꾹 누르는 순간, <br className="technology-title-break" /><mark className="technology-press-highlight">반응은 바로.</mark></h2>
          <p>연속해서 누르는 프레스가 답답하게 느껴지지 않도록.<br />화면 반응과 서버 통신 효과음 처리에서 기다리던 일을 나눴습니다.</p>
        </header>
        <StablePressContent />
      </div>
      <div id="technology-mobile-map-panel" hidden={activeTopic !== 'mobile-map'} role="tabpanel" aria-labelledby="technology-mobile-map-tab">
        <header className="technology-heading">
          <h2>지도를 움직일 때, <br className="technology-title-break" /><mark>감정 핀 표시는 더 빠르게.</mark></h2>
          <p>서버에서 받은 감정이 화면에 나타나기까지.<br />앱에서 반복하던 일을 줄여 첫 핀을 더 일찍 보여줍니다.</p>
        </header>
        <StableMobileMapContent />
      </div>
      <div id="technology-notification-panel" hidden={activeTopic !== 'notification'} role="tabpanel" aria-labelledby="technology-notification-tab">
        <header className="technology-heading">
          <h2>서버가 다시 켜져도 <br className="technology-title-break" /><mark>알림을 이어서 보내도록.</mark></h2>
          <p>서버가 종료되어도 기존 예약을 잃지 않도록.<br />보낼 알림을 기록하고 재시작 후에도 이어 처리합니다.</p>
        </header>
        {notificationVisited && !locked && <StableNotificationContent active={activeTopic === 'notification'} />}
      </div>
    </div>
  </section>;
}
