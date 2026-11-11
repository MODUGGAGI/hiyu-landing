import { shapes } from "./model.js";

// Remote main 1ae74fcf supplies the ranking layout and fixture count patterns.
// The landing uses ten fictional groups shared by both ranking categories.
// Group artwork is varied for the landing demo; each name keeps one identity across filters.
const groupStamps = {
  "월요일 생존단": ["rounded_rectangle", "#FFD990", "생존"],
  "퇴근이 필요해": ["ticket", "#FFAD99", "퇴근시켜"],
  "히유 클럽": ["circle", "#98FADF", "히유"],
  "숨고르기": ["oval", "#97D8F5", "후우"],
  "야근 탈출단": ["postage_stamp", "#C7B7F5", "야근탈출"],
  "천천히 괜찮아": ["four_leaf", "#A1EEA9", "괜찮"],
  "오늘도 버텨": ["rounded_rectangle", "#F6BAE4", "버텨"],
  "고요한 오후": ["folded_memo", "#B4EBD0", "쉼표"],
  "내일은 덜 바쁘길": ["tag", "#F4E19D", "휴식"],
  "한숨 충전소": ["flower", "#FFBACD", "충전"],
};

export function rankingGroupStamp(name) {
  const [shapeId, fill, label] = groupStamps[name] || ["circle", "#98FADF", "히유"];
  return { shape: shapes.find((shape) => shape.id === shapeId), fill, label, textColor: "#17191A" };
}
export const rankingFilters = [
  { id: "all", label: "전체", phrase: "", color: "#E6E4F4" },
  { id: "frustrated", label: "답답", phrase: "답답한", color: "#F8D3C0" },
  { id: "irritated", label: "짜증", phrase: "짜증나는", color: "#F3D7DF" },
  { id: "exhausted", label: "지침", phrase: "지친", color: "#E2DFEE" },
  { id: "discouraged", label: "좌절", phrase: "좌절한", color: "#D9E7F0" },
  { id: "angry", label: "분노", phrase: "분노한", color: "#F2D1CB" },
];

export const stampRankingRows = Object.keys(groupStamps).map((name, index) => ({
  name, count: [111, 98, 87, 76, 65, 54, 43, 36, 28, 19][index],
  rank: index + 1, stamp: rankingGroupStamp(name),
}));

const pressSamples = {
  frustrated: [["월요일 생존단",524],["히유 클럽",258],["퇴근이 필요해",237],["숨고르기",221],["한숨 충전소",198],["야근 탈출단",187],["천천히 괜찮아",163],["오늘도 버텨",142],["고요한 오후",119],["내일은 덜 바쁘길",94]],
  irritated: [["야근 탈출단",442],["히유 클럽",391],["오늘도 버텨",354],["퇴근이 필요해",312],["한숨 충전소",287],["월요일 생존단",244],["숨고르기",213],["내일은 덜 바쁘길",176],["천천히 괜찮아",151],["고요한 오후",108]],
  exhausted: [["고요한 오후",618],["한숨 충전소",486],["천천히 괜찮아",431],["히유 클럽",389],["월요일 생존단",352],["내일은 덜 바쁘길",318],["퇴근이 필요해",274],["숨고르기",231],["오늘도 버텨",190],["야근 탈출단",163]],
  discouraged: [["오늘도 버텨",309],["숨고르기",271],["히유 클럽",264],["월요일 생존단",251],["한숨 충전소",209],["천천히 괜찮아",183],["퇴근이 필요해",157],["고요한 오후",132],["내일은 덜 바쁘길",106],["야근 탈출단",82]],
  angry: [["퇴근이 필요해",720],["야근 탈출단",660],["숨고르기",537],["월요일 생존단",512],["히유 클럽",498],["오늘도 버텨",433],["한숨 충전소",387],["천천히 괜찮아",342],["고요한 오후",286],["내일은 덜 바쁘길",241]],
};

export function pressRankingRows(filter) {
  if (filter !== "all") {
    return (pressSamples[filter] || pressSamples.frustrated).map(([name, count], index) => ({
      name, count, rank: index + 1, stamp: rankingGroupStamp(name),
      isMyGroup: filter !== "irritated" && ["히유 클럽", "한숨 충전소"].includes(name),
    }));
  }
  const totals = new Map();
  Object.keys(pressSamples).forEach((id) => {
    const seen = new Set();
    pressRankingRows(id).forEach((group) => {
      if (seen.has(group.name)) return;
      seen.add(group.name);
      const old = totals.get(group.name);
      totals.set(group.name, { ...group, count: group.count + (old?.count || 0), isMyGroup: group.isMyGroup || !!old?.isMyGroup });
    });
  });
  return [...totals.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ko"))
    .map((group, index) => ({ ...group, rank: index + 1 }));
}

export function rankingDemoFrame(time = 0) {
  const elapsed = Number.isFinite(time) ? Math.max(0, time) : 0;
  const step = Math.floor(elapsed / 1000);
  const press = step % 2 === 1;
  const filterIndex = Math.floor(step / 2) % rankingFilters.length;
  return { tab: press ? "press" : "stamp", filter: rankingFilters[filterIndex].id, index: step };
}
