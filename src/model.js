export const emotions = [
  {
    id: "frustrated",
    name: "답답",
    color: "#F8D3C0",
    words: ["아오!!", "으아아", "꽉 막혔어", "후우…"],
    emoji: "😮‍💨",
    emojis: ["😮‍💨", "😤"],
    line: "속이 꽉 막혔어!",
  },
  {
    id: "irritated",
    name: "짜증",
    color: "#F3C7D6",
    words: ["아 진짜!", "으으…", "또?!", "그만 좀!"],
    emoji: "💢",
    emojis: ["💢", "🙄", "😑"],
    line: "오늘 왜 이러는 거야!",
  },
  {
    id: "exhausted",
    name: "지침",
    color: "#E1D9F0",
    words: ["ㅠㅠ", "방전…", "기력 0", "눕고 싶다"],
    emoji: "🪫",
    emojis: ["🫠", "🥱", "🪫"],
    line: "배터리 0%. 충전 필요.",
  },
  {
    id: "discouraged",
    name: "좌절",
    color: "#CCE5F2",
    words: ["ㅠㅠ", "털썩…", "안 돼…", "와르르"],
    emoji: "💧",
    emojis: ["😭", "🥲", "💧"],
    line: "내 의욕… 어디 갔지?",
  },
  {
    id: "angry",
    name: "분노",
    color: "#F5BEB3",
    words: ["으아악!!", "부글부글", "폭발 직전", "!!!"],
    emoji: "🔥",
    emojis: ["😡", "🤬", "🔥"],
    line: "으아아! 폭발 직전!!",
  },
];
// Ratios and normalized text areas from the app's StampShapeCatalog.kt.
export const shapes = [
  ["circle", "동그라미", 40, 41, 0.5, 0.46, 0.7, 0.42],
  ["ticket", "티켓", 40, 25.85, 0.48, 0.47, 0.68, 0.55],
  ["rounded_rectangle", "둥근 네모", 40, 40, 0.49, 0.45, 0.67, 0.42],
  ["oval", "타원", 42, 34, 0.48, 0.44, 0.68, 0.44],
  ["tag", "태그", 42, 25.2, 0.6, 0.48, 0.56, 0.9],
  ["flower", "꽃", 42, 40.568, 0.5, 0.49, 0.5, 0.64],
  ["postage_stamp", "우표", 42, 23.924, 0.49, 0.49, 0.68, 0.7],
  ["vertical_memo", "세로 메모", 32.5, 60, 0.51, 0.46, 0.68, 0.82],
  ["four_leaf", "네잎클로버", 42, 42, 0.5, 0.49, 0.48, 0.62],
  ["folded_memo", "접힌 메모", 42, 33, 0.46, 0.52, 0.62, 0.7],
].map(([id, name, w, h, cx, cy, tw, th]) => ({
  id,
  name,
  w,
  h,
  cx,
  cy,
  tw,
  th,
  overlay: [
    "tag",
    "flower",
    "postage_stamp",
    "vertical_memo",
    "four_leaf",
    "folded_memo",
  ].includes(id),
}));
export const trimLabel = (value) =>
  Array.from(value.replace(/[\r\n]/g, ""))
    .slice(0, 4)
    .join("");
export function hsvToHex(h, s, v) {
  const c = v * s,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = v - c;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return (
    "#" +
    [r, g, b]
      .map((n) =>
        Math.round((n + m) * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
      .toUpperCase()
  );
}
export function hexToHsv(hex) {
  const [r, g, b] = hex
      .match(/[0-9a-f]{2}/gi)
      .map((x) => parseInt(x, 16) / 255),
    max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  let h =
    d === 0
      ? 0
      : max === r
        ? ((g - b) / d) % 6
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: max === 0 ? 0 : d / max, v: max };
}
export function increment(counts, id) {
  return { ...counts, [id]: (counts[id] || 0) + 1 };
}

// Local map examples: every stamp uses the app's catalog and a four-character label.
export const mapStamps = [
  ["ticket", "퇴근시켜", "#83C8EF", "#202323", 45, 16],
  ["flower", "잠깐쉬자", "#F2BFCF", "#202323", 80, 18],
  ["tag", "버티는중", "#C8E4A6", "#202323", 8, 33],
  ["four_leaf", "같이힘내", "#D8CCED", "#202323", 92, 45],
  ["postage_stamp", "오늘도휴", "#FFE164", "#202323", 28, 60],
  ["rounded_rectangle", "제발살려", "#F2B6A3", "#202323", 70, 58],
].map(([shape, label, fill, textColor, x, y]) => ({
  shape: shapes.find((item) => item.id === shape),
  label: trimLabel(label),
  labelLines: ["ticket", "tag", "postage_stamp"].includes(shape)
    ? [trimLabel(label)]
    : [
        Array.from(label).slice(0, 2).join(""),
        Array.from(label).slice(2, 4).join(""),
      ],
  fill,
  textColor,
  x,
  y,
}));

// Keep the full drag area clear of the existing map records.
export const mapEmotionPositions = [
  { x: 15, y: 19 },
  { x: 91, y: 29 },
  { x: 10, y: 49 },
  { x: 78, y: 70 },
];
export const recordingDragBounds = {
  left: -65,
  right: 65,
  top: -85,
  bottom: 55,
};
