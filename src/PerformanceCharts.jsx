import React, { useEffect, useRef, useState } from 'react';

import { comparisonVersions, apis, resultsFor } from './map-performance.js';
const versions = comparisonVersions.map((v, i) => `0${i + 1} · ${v.label}`);
const fills = ['#c8cfcb', '#839188', '#ffe36b'];

function useChartWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(320);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = Math.round(entry.contentRect.width);
      // display:none is not a new chart size; retain the layout between tabs.
      if (nextWidth > 0) setWidth(nextWidth);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

function LatencyChart({ title, values, rate, ceiling }) {
  const [ref, width] = useChartWidth();
  const left = 32, right = 7, top = 30, bottom = 224, height = bottom - top;
  const barWidth = Math.min(38, (width - left - right) / 5);
  const step = (width - left - right) / 3;
  const y = value => bottom - value / ceiling * height;
  return <div ref={ref} className="performance-latency">
    <svg width="100%" height="286" viewBox={`0 0 ${width} 286`} role="img" aria-label={`${rate} RPS · ${title} p95: ${versions.map((name, i) => `${name} ${values[i].toFixed(2)} 밀리초`).join('; ')}`}> 
      {[0, ceiling / 4, ceiling / 2, ceiling * .75, ceiling].map(tick => <g key={tick}><line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} className="performance-grid" /><text x={left - 6} y={y(tick) + 4} textAnchor="end" className="performance-tick">{tick}</text></g>)}
      {values.map((value, i) => {
        const center = left + step * (i + .5);
        return <g key={value}><rect x={center - barWidth / 2} y={y(value)} width={barWidth} height={value / ceiling * height} fill={fills[i]} /><text x={center} y={y(value) - 9} textAnchor="middle" className={`performance-value ${i === 2 ? 'is-best' : ''}`}>{value.toFixed(2)} ms</text><text x={center} y="247" textAnchor="middle" className="performance-tick">0{i + 1}</text><text x={center} y="265" textAnchor="middle" className="performance-rps">{rate} RPS</text></g>;
      })}
    </svg>
    <h6>{title}</h6>
  </div>;
}

export default function PerformanceCharts({ rate }) {
  const results = resultsFor(rate);
  const ceiling = rate === 100 ? 120 : 800;
  return <div className="performance-charts" aria-label={`${rate} RPS 지도 조회 성능 비교`}>
    <p className="performance-load-context"><strong>같은 요청량 · {rate} RPS</strong><span>핀·시도·시군구 합산 목표 요청량 · 조건별 3회 p95의 중앙값</span></p>
    <div className="performance-legend" aria-label="비교 버전">{versions.map((name, i) => <span key={name}><i style={{ background: fills[i] }} aria-hidden="true" />{name}</span>)}</div>
    <div className="performance-latencies"><h5>API별 응답시간 p95 ↓</h5><p className="performance-chart-hint">낮을수록 좋아요 · 세 그래프의 눈금은 동일합니다 (0–{ceiling}ms).<br />100 RPS는 0–120ms, 150 RPS는 0–800ms 눈금으로 표시합니다.</p><div className="performance-latency-grid">
      {apis.map(api => <LatencyChart key={api.key} title={api.label} rate={rate} ceiling={ceiling} values={comparisonVersions.map(v => results[v.key].p95[api.key])} />)}
    </div></div>
  </div>;
}
