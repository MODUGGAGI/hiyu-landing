import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import {
  animate,
  motion,
  MotionConfig,
  useMotionValueEvent,
  useReducedMotion,
  useMotionValue,
  useTransform,
} from "motion/react";
import PhoneExperience from "./PhoneExperience.jsx";
import TechnologySection from "./TechnologySection.jsx";
import "./phone.css";
import "./phone-source.css";

import "./phone-register.css";

const FIGMA = "/assets/figma/";
const ramp = (value, start, end) =>
  Math.max(0, Math.min(1, (value - start) / (end - start)));

const cast = [
  {
    id: "discouraged",
    name: "좌절",
    origin: [0.356, 0.757],
    line: ["오늘도 왜 나만", "이렇게 힘든 거죠?"],
  },
  {
    id: "exhausted",
    name: "지침",
    origin: [0.793, 0.445],
    line: ["괜찮은 척하기도", "이제 지쳤어요."],
  },
  {
    id: "irritated",
    name: "짜증",
    origin: [0.512, 0.259],
    line: ["참으라고요?", "내가 제일 힘든데요."],
  },
  {
    id: "frustrated",
    name: "답답",
    origin: [0.229, 0.437],
    line: ["남들도 힘들다지만", "일단 내가 제일 힘들어요!!"],
  },
  {
    id: "angry",
    name: "분노",
    origin: [0.672, 0.751],
    line: ["내가 제일 힘들다는 걸", "이 공간에서 표출해봐요!!"],
  },
];
function StoreButtons() {
  const ios =
    import.meta.env.VITE_APP_STORE_URL ||
    "https://apps.apple.com/kr/app/%ED%9E%88%EC%9C%A0/id6807732687";
  const android =
    import.meta.env.VITE_PLAY_STORE_URL ||
    "https://play.google.com/store/apps/details?id=com.pheeeew";
  return (
    <div className="store-buttons">
      <a
        className="store-button"
        href={ios}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="App Store에서 히유 다운로드 (새 탭)"
      >
        <img src="/assets/stores/apple.svg" alt="" width="36" height="44" />
        <span>
          <small>Download on the</small>
          <strong>App Store</strong>
        </span>
      </a>
      <a
        className="store-button"
        href={android}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Google Play에서 히유 다운로드 (새 탭)"
      >
        <img
          src="/assets/stores/google-play.svg"
          alt=""
          width="40"
          height="44"
        />
        <span>
          <small>GET IT ON</small>
          <strong>Google Play</strong>
        </span>
      </a>
    </div>
  );
}
function useStageSize(ref) {
  const [size, setSize] = useState({ w: 1200, h: 800 });
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height }),
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}
function positions(w, h, index) {
  const small = w < 640,
    orbSize = small
      ? Math.min(w * 0.87, h * (h < 620 ? 0.35 : 0.38))
      : Math.min(w * 0.43, h * 0.72);
  const orb = {
    size: orbSize,
    x: small ? (w - orbSize) / 2 : w * 0.77 - orbSize / 2,
    y: h * (small ? 0.69 : 0.49) - orbSize / 2,
  };
  const face = orbSize * 0.265;
  const endSize = small ? Math.min(w * 0.23, 96) : Math.min(w * 0.115, 168);
  const cx = small
    ? index < 3
      ? ((index + 0.5) * w) / 3
      : ((index - 2) * w) / 3
    : (w * (index + 0.5)) / 5;
  const cy = small ? (index < 3 ? h * 0.31 : h * 0.64) : h * 0.43;
  return { orb, face, endSize, cx, cy, small };
}
function StoryCharacter({ item, index, zoom, spread, size, paused }) {
  const { w, h } = size,
    p = positions(w, h, index);
  const travel = useTransform(() => {
    const t = ramp(spread.get(), index * 0.06, index * 0.06 + 0.66);
    return 1 - Math.pow(1 - t, 3);
  });
  const width = useTransform(() => {
    const closeSize = p.face * (1 + zoom.get() * 0.2);
    return closeSize + (p.endSize - closeSize) * travel.get();
  });
  const x = useTransform(() => {
    const from = p.orb.x + p.orb.size * item.origin[0];
    const inside = w / 2 + (item.origin[0] - 0.5) * p.orb.size * 0.95;
    const center = from + (inside - from) * zoom.get();
    return center + (p.cx - center) * travel.get() - width.get() / 2;
  });
  const y = useTransform(() => {
    const from = p.orb.y + p.orb.size * item.origin[1];
    const inside = h * 0.48 + (item.origin[1] - 0.5) * p.orb.size * 0.95;
    const center = from + (inside - from) * zoom.get();
    return center + (p.cy - center) * travel.get() - width.get() / 2;
  });
  const rotate = useTransform(
    () => Math.sin(travel.get() * Math.PI) * (index % 2 ? 10 : -10),
  );
  return (
    <motion.div
      className="story-character"
      style={{ x, y, width, rotate }}
      aria-hidden="true"
    >
      <motion.img
        src={`${FIGMA}emotion-${item.id}.svg`}
        alt=""
        draggable="false"
        animate={
          paused
            ? { y: 0, rotate: 0 }
            : { y: [0, -7, 0, 5, 0], rotate: [0, index % 2 ? 3 : -3, 0] }
        }
        transition={
          paused
            ? { duration: 0 }
            : {
                duration: 4.4 + index * 0.37,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      />
    </motion.div>
  );
}
function ComicPanels({ size, level }) {
  return (
    <div
      className="comic-panels"
      id="emotion-stories"
      aria-hidden={level < 0.6}
      style={{ opacity: ramp(level, 0.45, 0.9) }}
    >
      {cast.map((c, i) => {
        const p = positions(size.w, size.h, i),
          pw = p.small ? size.w * 0.29 : size.w * 0.182;
        return (
          <article
            key={c.id}
            className="comic-panel"
            style={{
              left: p.cx - pw / 2,
              top: p.cy - p.endSize / 2 - 26,
              width: pw,
              height: p.small ? 192 : Math.min(size.h * 0.47, 380),
            }}
          >
            <p style={{ marginTop: p.endSize + 50 }}>
              {c.line[0]}
              <br />
              {c.line[1]}
            </p>
          </article>
        );
      })}
    </div>
  );
}
function BubbleStory({ paused, onReady, showOverview }) {
  const stage = useRef(),
    trigger = useRef(),
    continuation = useRef(),
    animation = useRef(),
    started = useRef(false),
    focusAfterEntry = useRef(false),
    size = useStageSize(stage);
  const zoom = useMotionValue(0),
    spread = useMotionValue(0);
  const [phase, setPhase] = useState("intro");
  const [level, setLevel] = useState(0);
  useMotionValueEvent(spread, "change", setLevel);
  const finish = useCallback(() => {
    animation.current?.stop();
    zoom.set(1);
    spread.set(1);
    setPhase("arranged");
    onReady();
  }, [zoom, spread, onReady]);
  const enterBubble = () => {
    if (started.current) return;
    started.current = true;
    focusAfterEntry.current = document.activeElement === trigger.current;
    if (paused) {
      finish();
      return;
    }
    setPhase("entering");
    animation.current = animate(zoom, 1, {
      duration: 0.58,
      ease: [0.32, 0, 0.2, 1],
      onComplete: () => {
        setPhase("spreading");
        animation.current = animate(spread, 1, {
          duration: 0.82,
          ease: "linear",
          onComplete: finish,
        });
      },
    });
  };
  useEffect(() => () => animation.current?.stop(), []);
  useLayoutEffect(() => {
    if (!showOverview) return;
    started.current = true;
    focusAfterEntry.current = false;
    finish();
  }, [showOverview, finish]);
  useEffect(() => {
    if (paused && started.current) finish();
  }, [paused, finish]);
  useEffect(() => {
    if (phase === "arranged" && focusAfterEntry.current) {
      const active = document.activeElement;
      if (active === trigger.current || active === document.body) {
        continuation.current?.focus({ preventScroll: true });
      }
      focusAfterEntry.current = false;
    }
  }, [phase]);
  const { orb } = positions(size.w, size.h, 0);
  const heroOpacity = useTransform(zoom, [0, 0.35], [1, 0]);
  const backdropOpacity = useTransform(zoom, [0, 0.6], [1, 0]);
  // The original rim passes beyond the viewport before its film clears.
  const portalScale = useTransform(
    zoom,
    [0, 1],
    [1, (Math.hypot(size.w, size.h) / orb.size) * 1.12],
  );
  const portalX = useTransform(
    zoom,
    [0, 1],
    [0, size.w / 2 - orb.x - orb.size / 2],
  );
  const portalY = useTransform(
    zoom,
    [0, 1],
    [0, size.h * 0.48 - orb.y - orb.size / 2],
  );
  const portalOpacity = useTransform(spread, [0, 0.45], [1, 0]);
  return (
    <section
      className="bubble-story"
      id="top"
      aria-label="히유의 감정 이야기"
      data-phase={phase}
    >
      <div ref={stage} className="story-stage">
        <motion.div
          className="figma-backdrop"
          style={{ opacity: backdropOpacity }}
          aria-hidden="true"
        >
          {[0, 1, 2, 3].map((index) => (
            <motion.img
              key={index}
              className={`decorative-bubble decorative-bubble-${index}`}
              src={`${FIGMA}bubble-small.svg`}
              alt=""
              animate={paused ? { y: 0 } : { y: [0, -12, 0] }}
              transition={
                paused
                  ? { duration: 0 }
                  : {
                      duration: 7 + index * 0.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
              }
            />
          ))}
        </motion.div>
        <motion.div
          className="hero-copy"
          inert={phase !== "intro"}
          aria-hidden={phase !== "intro"}
          style={{ opacity: heroOpacity }}
        >
          <h1>
            <span>히유</span>
            <small>감정 공유 지도</small>
          </h1>
          <p>
            참았던 기분, 지도 위에 툭.
            <br />
            친구들과 나누면 조금은 가벼워질 거예요.
          </p>
          <StoreButtons />
        </motion.div>
        <motion.div
          className="soap-portal"
          aria-hidden="true"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            x: portalX,
            y: portalY,
            scale: portalScale,
            opacity: portalOpacity,
          }}
        >
          <motion.img
            src={`${FIGMA}bubble-main.svg`}
            alt=""
            animate={
              !paused && phase === "intro"
                ? { y: [0, -8, 0, 5, 0], rotate: [0, 1.2, 0, -1, 0] }
                : { y: 0, rotate: 0 }
            }
            transition={
              !paused && phase === "intro"
                ? { duration: 6, repeat: Infinity, ease: "easeInOut" }
                : { duration: paused ? 0 : 0.18 }
            }
          />
        </motion.div>
        <ComicPanels size={size} level={level} />
        {cast.map((c, i) => (
          <StoryCharacter
            key={c.id}
            item={c}
            index={i}
            zoom={zoom}
            spread={spread}
            size={size}
            paused={paused}
          />
        ))}
        <button
          ref={trigger}
          className="bubble-enter"
          type="button"
          onClick={enterBubble}
          disabled={phase !== "intro"}
          aria-hidden={phase !== "intro"}
          aria-controls="emotion-stories"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            visibility: phase === "intro" ? "visible" : "hidden",
          }}
        >
          <span className="bubble-prompt">
            버블을 눌러주세요!! <span aria-hidden="true">↑</span>
          </span>
        </button>
        <a
          ref={continuation}
          className="meet-phones"
          href="#experience"
          style={{
            opacity: ramp(level, 0.85, 1),
            pointerEvents: phase === "arranged" ? "auto" : "none",
          }}
          tabIndex={phase === "arranged" ? 0 : -1}
          aria-hidden={phase !== "arranged"}
        >
          <span>히유의 세 가지 즐거움</span>
          <span className="scroll-cue-arrow" aria-hidden="true">
            ↓
          </span>
        </a>
      </div>
    </section>
  );
}
function PhoneShowcase({ paused, locked }) {
  const demos = [
    {
      id: "register",
      title: "지도 위에 툭",
      subtitle: "지금 이 기분, 여기에 남겨요.",
      tilt: -3,
    },
    {
      id: "tap",
      title: "참지 말고 꾹꾹",
      subtitle: "꾹꾹 누르고, 실시간으로 앞질러요.",
      tilt: 4,
    },
    {
      id: "collection",
      title: "모으는 재미, 차곡차곡",
      subtitle: "차곡차곡 쌓인 감정, 나만의 컬렉션.",
      tilt: -3,
    },
  ];
  return (
    <section
      id="experience"
      inert={locked}
      className="phone-showcase"
      aria-label="히유의 세 가지 자동 미리보기"
    >
      <div className="showcase-grid">
        {demos.map((demo, i) => (
          <article
            className={`showcase-item showcase-${demo.id}`}
            key={demo.id}
            style={{ "--tilt": `${demo.tilt}deg` }}
          >
            <div className="showcase-caption">
              <span>0{i + 1}</span>
              <h3>{demo.title}</h3>
              <p>{demo.subtitle}</p>
            </div>
            <motion.div
              initial={paused ? false : { y: 70, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                type: "spring",
                stiffness: 110,
                damping: 24,
                delay: paused ? 0 : i * 0.09,
              }}
            >
              <div className="showcase-device-shell">
                <PhoneExperience paused={paused} demo={demo.id} />
              </div>
            </motion.div>
          </article>
        ))}
      </div>
      <p className="showcase-note">앱 화면을 자동으로 보여드려요. 카드와 순위는 시연용 예시예요.</p>
    </section>
  );
}
export default function App() {
  const reduced = useReducedMotion(),
    [storyKey, setStoryKey] = useState(0),
    [storyReady, setStoryReady] = useState(() => ['#emotion-stories', '#experience', '#technology'].includes(window.location.hash)),
    [storyOverview, setStoryOverview] = useState(() => window.location.hash === '#emotion-stories');
  const leftTop = useRef(false);
  const [headerScrolled, setHeaderScrolled] = useState(() => window.scrollY > 24);
  useEffect(() => {
    const updateHeader = () => setHeaderScrolled(window.scrollY > 24);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    return () => window.removeEventListener('scroll', updateHeader);
  }, []);
  const paused = !!reduced;
  useLayoutEffect(() => {
    const target = window.location.hash.slice(1);
    if (!['emotion-stories', 'experience', 'technology'].includes(target)) return;
    const frame = requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ behavior: 'instant', block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, []);
  const unlockStory = useCallback(() => setStoryReady(true), []);
  const resetStory = useCallback(() => {
    leftTop.current = false;
    window.scrollTo({ top: 0, behavior: "instant" });
    setStoryKey((key) => key + 1);
    setStoryOverview(false);
    setStoryReady(false);
  }, []);
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.storyLocked = String(!storyReady);
    if (storyReady) return () => delete root.dataset.storyLocked;
    // Browsers may restore a previous scroll position after the initial layout.
    const keepAtTop = () => {
      if (window.scrollY !== 0)
        window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("scroll", keepAtTop, { passive: true });
    window.addEventListener("pageshow", keepAtTop);
    keepAtTop();
    const frame = requestAnimationFrame(keepAtTop);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", keepAtTop);
      window.removeEventListener("pageshow", keepAtTop);
      delete root.dataset.storyLocked;
    };
  }, [storyReady]);
  useEffect(() => {
    if (!storyReady) return;
    const onScroll = () => {
      if (window.scrollY > 24) leftTop.current = true;
      if (leftTop.current && window.scrollY <= 1 && !storyOverview) resetStory();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [storyReady, storyOverview, resetStory]);
  const openStory = () => {
    flushSync(() => {
      setStoryOverview(true);
      unlockStory();
    });
  };
  // Explicit navigation can skip the intro; wheel/touch scrolling cannot.
  const openPreview = () => {
    // Release the lock before the browser follows the native anchor link.
    flushSync(unlockStory);
  };
  useEffect(() => {
    document.documentElement.dataset.motion = paused ? "off" : "on";
  }, [paused]);
  return (
    <MotionConfig reducedMotion={paused ? "always" : "never"}>
      <div className="site">
        <div className="site-map" aria-hidden="true">
          <img src={`${FIGMA}map-landscape.svg`} alt="" fetchPriority="high" />
        </div>
        <a className="skip-link" href="#experience" onClick={openPreview}>
          앱 미리보기로 바로가기
        </a>
        <header className={`story-header${headerScrolled ? ' is-scrolled' : ''}`}>
          <a
            href="#top"
            className="brand"
            aria-label="히유 홈"
            onClick={(event) => {
              event.preventDefault();
              resetStory();
            }}
          >
            <img className="brand-icon" src="/assets/hiyu-app-icon.png" alt="" width="40" height="40" />
            <span>히유</span>
          </a>
          <div id="technology-header-slot" className="technology-header-slot" />
          <nav className="header-links" aria-label="주요 메뉴">
          <a className="technology-link" href="#emotion-stories" onClick={openStory}>히유 이야기</a>
          <a className="technology-link" href="#experience" onClick={openPreview}>기능 소개</a>
          <a className="technology-link" href="#technology" onClick={openPreview}>기술 소개</a>
          <a
            className="pain-test-link"
            href="https://pheeeew.com/pain-test/"
            target="_blank"
            rel="noopener"
            aria-label="고통 지수 측정하러 가기 (새 탭)"
          >
            <span className="pain-test-label">고통 지수 측정하러 가기</span><span className="pain-test-short-label" aria-hidden="true">고통 지수</span> <span aria-hidden="true">↗</span>
          </a>
          </nav>
        </header>
        <main>
          <BubbleStory key={storyKey} paused={paused} onReady={unlockStory} showOverview={storyOverview} />
          <PhoneShowcase paused={paused} locked={!storyReady} />
          <TechnologySection locked={!storyReady} />
        </main>
        <footer className="story-footer" inert={!storyReady}>
          <div className="footer-download">
            <h2>히유에서 만나요!!</h2>
            <StoreButtons />
          </div>
          <div className="footer-meta">
            <span>히유</span>
            <a
              className="instagram-link"
              href="https://www.instagram.com/pheeeew.official?stkn=MXZ6NHJhc2M0aWlraQ=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="히유 인스타그램 (새 탭)"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle
                  cx="17.5"
                  cy="6.5"
                  r="1"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
            </a>
            <small>© 2026 Pheeeew</small>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
