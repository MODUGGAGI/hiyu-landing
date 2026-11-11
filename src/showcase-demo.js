import { emotions } from './model.js';

const loop = (time, duration) => ((time % duration) + duration) % duration;

// One fictional account's daily cards. Four different original illustrations per emotion.
export const collectionCards = Array.from({ length: 20 }, (_, index) => {
  const emotion = emotions[index % 5];
  const variant = String(Math.floor(index / 5) + 1).padStart(2, '0');
  const asset = kind => `/assets/collection-figma/${kind}/${emotion.id}/${variant}.webp`;
  return {
    id: `${emotion.id}-${variant}`, emotion,
    title: '기분수집가', date: `2026.10.${String(29 - index).padStart(2, '0')}`,
    character: asset('characters'), headline: asset('stamps-straight'), seal: asset('stamps-round'),
    pressCount: index === 0 ? 100 : 130 + index * 37,
    recordCount: 1 + index % 4,
  };
});

export const filterCollection = emotion => emotion === 'all'
  ? collectionCards : collectionCards.filter(card => card.emotion.id === emotion);

// Four short swipes with decelerating momentum and reading pauses.
const albumSwipes = [
  [180, 620, 0, .24],
  [1120, 620, .24, .51],
  [2070, 640, .51, .78],
  [3020, 550, .78, 1],
];
function albumScrollProgress(time) {
  let position = 0;
  for (const [start, duration, from, to] of albumSwipes) {
    if (time < start) break;
    const t = Math.min(1, (time - start) / duration);
    position = from + (to - from) * (1 - (1 - t) ** 3);
  }
  return position;
}

export function collectionDemoFrame(time) {
  const elapsed = loop(time, 8500);
  const scene = elapsed < 3500 ? 'coverflow' : elapsed < 7300 ? 'album' : 'filtered';
  return {
    scene,
    // Start one card in so both neighboring cards are present immediately.
    index: scene === 'coverflow' ? 1 + Math.min(4, Math.floor(elapsed / 700)) : 1,
    filter: scene === 'filtered' ? emotions[loop(Math.floor(time / 8500), emotions.length)].id : 'all',
    albumProgress: scene === 'album' ? albumScrollProgress(elapsed - 3500) : 0,
  };
}

export function mapDemoFrame(time) {
  let cursor = loop(time, 6000);
  for (const [scene, duration] of [['select', 1100], ['memo', 2000], ['locate', 1200], ['map', 1700]]) {
    if (cursor < duration) return {
      scene, progress: cursor / duration, duration,
      emotion: emotions[loop(Math.floor(time / 6000), emotions.length)],
      pressing: cursor >= duration - 220 && cursor < duration - 80,
    };
    cursor -= duration;
  }
}

// Deterministic local examples, never connected to live participants or scores.
export function pressDemoFrame(time) {
  const elapsed = loop(time, 5800);
  // Accelerated landing demo: 55ms taps, 4.8s competition, 1s full ranking.
  const pressTime = Math.min(elapsed, 4799);
  const taps = Math.floor(pressTime / 55);
  const emotionTaps = emotions.map((_, i) => Math.floor(taps / 50) * 10 + Math.max(0, Math.min(10, taps % 50 - i * 10)));
  const activeEmotion = Math.floor(Math.max(0, taps - 1) / 10) % emotions.length;
  // Recover between bursts so every new burst can visibly build up and pop again.
  const faceStages = emotionTaps.map((count, i) => {
    if (!count) return 0;
    const inBurst = i === activeEmotion ? ((taps - 1) % 10) + 1 : 10;
    const lastTap = i === activeEmotion ? taps : taps - ((taps - 1) % 10 + 1) - ((activeEmotion - i - 1 + 5) % 5) * 10;
    const recovery = Math.floor(Math.max(0, pressTime - lastTap * 55 - 120) / 60);
    return Math.max(0, Math.min(5, Math.floor(inBurst * 6 / 10)) - recovery);
  });
  const counts = [240, 250, 260, 250, 240].map((base, i) => base + emotionTaps[i]);
  const myCount = 1240 + taps;
  // A rival passes at 1.5s; my 55ms taps reclaim second at 2.475s and first at 3.520s.
  // Opponent totals keep increasing, including after each overtake.
  const leaderCount = 1260 + Math.min(43, Math.floor(pressTime / 65)) + Math.floor(Math.max(0, pressTime - 3520) / 220);
  const rivalCount = pressTime < 1500
    ? Math.min(myCount - 1, 1230 + Math.floor(pressTime / 40))
    : 1268 + Math.min(16, Math.floor((pressTime - 1500) / 55)) + Math.floor(Math.max(0, pressTime - 2475) / 275);
  const rows = [
    { id: 'one', name: '월요일생존자', count: leaderCount, emotion: 0 },
    { id: 'two', name: '오늘도퇴근중', count: rivalCount, emotion: 1 },
    { id: 'three', name: '마음충전중', count: 1210 + Math.floor(pressTime / 165), emotion: 2 },
    { id: 'four', name: '숨고르는중', count: 1180 + Math.floor(pressTime / 300), emotion: 3 },
    { id: 'me', name: '기분수집가', count: myCount, emotion: 4, isMe: true },
    { id: 'six', name: '느긋한구름', count: 1140 + Math.floor(pressTime / 275), emotion: 0 },
  ].sort((a, b) => b.count - a.count).map((row, i) => ({ ...row, rank: i + 1 }));
  const me = rows.find(row => row.isMe);
  const myIndex = rows.indexOf(me);
  const nearbyStart = Math.max(0, Math.min(myIndex - 1, rows.length - 3));
  return {
    scene: elapsed >= 4800 ? 'ranking' : 'press',
    taps, counts, emotionTaps, faceStages, me, rows,
    nearby: rows.slice(nearbyStart, nearbyStart + 3),
    activeEmotion,
    notice: me.rank === 1 ? '▲ 2명 추월!' : me.rank === 2 && pressTime >= 2475 ? '▲ 1명 추월!' : '',
    openingRanking: elapsed >= 4520 && elapsed < 4700,
  };
}
