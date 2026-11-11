import measurements from '../public/technology/map-performance-data.js';

export const rates = [100, 150];
export const comparisonVersions = measurements.versions.filter(v => v.key !== 'v3');
export const allVersions = measurements.versions;
export const apis = [{ key: 'pins', label: '개별 핀' }, { key: 'sido', label: '시도 집계' }, { key: 'sigungu', label: '시군구 집계' }];
export const resultsFor = rate => measurements.rates[rate];
export function summaryFor(rate) {
  const results = resultsFor(rate);
  const before = apis.map(api => results.v1.p95[api.key]);
  const after = apis.map(api => results.v4.p95[api.key]);
  const reductions = before.map((value, i) => (1 - after[i] / value) * 100);
  const range = values => `${Math.min(...values).toFixed(0)}~${Math.max(...values).toFixed(0)}`;
  return { before: range(before), after: range(after), reduction: `${Math.min(...reductions).toFixed(1)}~${Math.max(...reductions).toFixed(1)}` };
}
