import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Face, Stamp } from "./components.jsx";
import { emotions } from "./model.js";
import { pressRankingRows, rankingDemoFrame, rankingFilters, stampRankingRows } from "./ranking-demo.js";
import "./ranking.css";

function WeekSelector({ press }) {
  return <div className="ranking-week">
    <svg className="ranking-week-arrow" viewBox="0 0 44 36" aria-hidden="true"><path d="M24 14 20 18 24 22" /></svg>
    <span>{press ? "2026.09.23 ~ 2026.09.30" : "2026.09.16 ~ 2026.09.23"}</span>
    <svg className="ranking-week-arrow ranking-week-next" viewBox="0 0 44 36" aria-hidden="true"><path d="M20 14 24 18 20 22" /></svg>
  </div>;
}

function StampRanking() {
  return <>
    <div className="ranking-podium">
      {[stampRankingRows[1], stampRankingRows[0], stampRankingRows[2]].map((member) =>
        <div key={member.rank} className={`ranking-podium-card ranking-place-${member.rank}`}>
          <strong className="ranking-place">{member.rank}위</strong>
          {member.rank === 1 && <img className="ranking-crown" src="/assets/weekly_ranking_crown.svg" alt="" />}
          <Stamp {...member.stamp} size={member.rank === 1 ? 62 : 56} />
          <div className="ranking-podium-detail">
            <span className="ranking-podium-name">{member.name}</span>
            <span className="ranking-podium-label">감정 스탬프</span>
            <strong className="ranking-podium-count">{member.count}개</strong>
          </div>
        </div>)}
    </div>
    <div className="ranking-stamp-list">
      {stampRankingRows.slice(3).map((member) => <div className="ranking-stamp-row" key={member.rank}>
        <strong className="ranking-stamp-place">{member.rank}위</strong>
        <Stamp {...member.stamp} size={47} />
        <strong className="ranking-stamp-name">{member.name}</strong>
        <div className="ranking-stamp-score"><span>감정 스탬프</span><strong>{member.count}개</strong></div>
      </div>)}
    </div>
  </>;
}

function PressRanking({ frame, paused }) {
  const filtersRef = useRef(null);
  const filter = rankingFilters.find((item) => item.id === frame.filter);
  const groups = pressRankingRows(frame.filter);
  const myGroups = groups.filter((group) => group.isMyGroup);
  const myGroup = myGroups[frame.index % myGroups.length];
  useEffect(() => {
    const index = rankingFilters.findIndex((item) => item.id === frame.filter);
    filtersRef.current?.scrollTo({ left: Math.max(0, index * 80 - 80), behavior: paused ? "instant" : "smooth" });
  }, [frame.filter, paused]);
  return <>
    <div className="ranking-filters" ref={filtersRef}>
      {rankingFilters.map((item) => <span key={item.id} className={`ranking-filter ${item.id === frame.filter ? "ranking-filter-selected" : ""}`}>{item.label}</span>)}
    </div>
    {myGroup && <div className="ranking-my-group-space">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div key={`${frame.filter}-${myGroup.name}`} className="ranking-my-group" style={{ backgroundColor: filter.color }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: paused ? 0 : .8 }}>
          {frame.filter === "all"
            ? <img className="ranking-my-face" src="/assets/press_all_emotions.svg" alt="" />
            : <Face className="ranking-my-face" source="app" emotion={emotions.find((emotion) => emotion.id === frame.filter)} />}
          <div className="ranking-my-copy"><strong>{myGroup.name}</strong><b>{myGroup.rank}위</b><span>{myGroup.count}번의 {filter.phrase ? `${filter.phrase} ` : ""}마음</span></div>
        </motion.div>
      </AnimatePresence>
    </div>}
    <div className="ranking-press-list">
      {groups.map((group) => <div key={`${group.rank}-${group.name}`} className={`ranking-press-row ${group.isMyGroup ? "ranking-is-mine" : ""}`}>
        <strong className="ranking-press-place">{String(group.rank).padStart(2, "0")}</strong>
        <Stamp {...group.stamp} size={47} />
        <div className="ranking-press-name"><strong>{group.name}</strong>{group.isMyGroup && <span>내 그룹</span>}</div>
        <strong className="ranking-press-count">{group.count}</strong>
      </div>)}
    </div>
  </>;
}

export default function RankingScreen({ time = 0, paused = false }) {
  const frame = rankingDemoFrame(time);
  const press = frame.tab === "press";
  return <div className="ranking-screen" data-ranking-tab={frame.tab} data-ranking-filter={frame.filter}>
    <AnimatePresence initial={false}>
      <motion.section key={frame.tab} className="ranking-page"
        initial={{ x: press ? "100%" : "-100%" }} animate={{ x: 0 }} exit={{ x: press ? "100%" : "-100%" }}
        transition={{ duration: paused ? 0 : .3, ease: [.4, 0, .2, 1] }}>
        <h3 className="ranking-topbar">{press ? "프레스 주간 랭킹" : "스탬프 주간 랭킹"}</h3>
        <div className="ranking-content"><WeekSelector press={press} />{press ? <PressRanking frame={frame} paused={paused} /> : <StampRanking />}</div>
      </motion.section>
    </AnimatePresence>
  </div>;
}
