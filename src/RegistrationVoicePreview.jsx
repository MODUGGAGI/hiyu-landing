import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./registration-voice.css";

const MAX_DURATION = 60_000;
const initialState = {
  phase: "ready",
  elapsed: 0,
  position: 0,
  playing: false,
};
const formatTime = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};

function Waveform({ elapsed, recording, progress = 0 }) {
  const container = useRef(null);
  const [width, setWidth] = useState(180);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(1, entry.contentRect.width));
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  const bars = useMemo(() => {
    // Local demo samples; no microphone, audio stream, or recorded data.
    const count = Math.ceil(elapsed / 100);
    const samples = Array.from(
      { length: count },
      (_, i) =>
        0.06 + Math.abs(Math.sin(i * 0.61) * Math.sin(i * 0.17 + 0.4)) * 0.82,
    );
    const waveform = recording
      ? [
          ...Array(Math.max(0, 64 - samples.length)).fill(0),
          ...samples.slice(-64),
        ]
      : samples;
    const size = Math.max(1, Math.min(Math.floor(width / 6), waveform.length));
    return Array.from({ length: size }, (_, index) => {
      const start = Math.floor((index * waveform.length) / size);
      const end = Math.floor(((index + 1) * waveform.length) / size);
      const amplitude = Math.max(0, ...waveform.slice(start, end));
      return {
        x: (width / size) * (index + 0.5),
        height: Math.max(3, 48 * amplitude),
      };
    });
  }, [elapsed, recording, width]);

  const lines = bars.map(({ x, height }, index) => (
    <line
      key={index}
      x1={x}
      x2={x}
      y1={(48 - height) / 2}
      y2={(48 + height) / 2}
    />
  ));
  return (
    <span
      ref={container}
      className="registration-voice-waveform"
      aria-hidden="true"
    >
      <svg viewBox={`0 0 ${width} 48`} preserveAspectRatio="none">
        <g
          stroke={recording ? "#e26962" : "#a3aba5"}
          strokeWidth="3"
          strokeLinecap="round"
        >
          {lines}
        </g>
      </svg>
      {!recording && (
        <svg
          viewBox={`0 0 ${width} 48`}
          preserveAspectRatio="none"
          style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }}
        >
          <g stroke="#e26962" strokeWidth="3" strokeLinecap="round">
            {lines}
          </g>
        </svg>
      )}
    </span>
  );
}

function PlaybackIcon({ playing }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 100 100"
      aria-hidden="true"
      fill="white"
    >
      {playing ? (
        <>
          <rect x="28" y="18" width="16" height="64" />
          <rect x="56" y="18" width="16" height="64" />
        </>
      ) : (
        <path d="M35 20 78 50 35 80Z" />
      )}
    </svg>
  );
}

export default function RegistrationVoicePreview({
  paused = false,
  onReadyChange,
}) {
  const [state, setState] = useState(initialState);
  const descriptionId = useId();
  const notify = useRef(onReadyChange);
  const primaryButton = useRef(null);
  const moveFocus = useRef(false);
  notify.current = onReadyChange;

  useLayoutEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    primaryButton.current?.focus({ preventScroll: true });
  }, [state.phase]);

  useEffect(() => {
    notify.current?.(state.phase === "completed");
  }, [state.phase]);
  useEffect(() => () => notify.current?.(false), []);

  useEffect(() => {
    if (paused || (state.phase !== "recording" && !state.playing)) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const delta = Math.min(now - last, 250);
      last = now;
      setState((current) => {
        if (current.phase === "recording") {
          const elapsed = Math.min(MAX_DURATION, current.elapsed + delta);
          return {
            ...current,
            elapsed,
            phase: elapsed === MAX_DURATION ? "completed" : "recording",
          };
        }
        if (!current.playing) return current;
        const position = Math.min(current.elapsed, current.position + delta);
        return { ...current, position, playing: position < current.elapsed };
      });
    }, 100);
    return () => clearInterval(timer);
  }, [paused, state.phase, state.playing]);

  const start = () => {
    moveFocus.current = true;
    setState({ ...initialState, phase: "recording" });
  };
  const stop = () => {
    moveFocus.current = true;
    setState((current) => ({
      ...current,
      phase: "completed",
      elapsed: Math.max(100, current.elapsed),
    }));
  };
  const clear = () => {
    moveFocus.current = true;
    setState(initialState);
  };
  const togglePlayback = () =>
    setState((current) => ({
      ...current,
      playing: !current.playing,
      position: current.position >= current.elapsed ? 0 : current.position,
    }));

  return (
    <div
      className="registration-voice-preview"
      aria-describedby={descriptionId}
    >
      <span id={descriptionId} className="registration-voice-sr">
        마이크를 사용하지 않는 녹음 화면 체험이에요. 재생 버튼은 파형의 움직임을
        보여줘요.
      </span>
      <div className="registration-voice-panel">
        {state.phase === "ready" && (
          <button
            ref={primaryButton}
            className="registration-voice-ready"
            type="button"
            onClick={start}
            aria-label="녹음 시연 시작"
          >
            <span className="registration-voice-mic app-raised">
              <span className="app-button-content">
                <img src="/assets/ic_mic.svg" alt="" />
              </span>
            </span>
          </button>
        )}
        {state.phase === "recording" && (
          <button
            ref={primaryButton}
            className="registration-voice-recording"
            type="button"
            onClick={stop}
            aria-label="녹음 시연 중지"
          >
            <span className="registration-voice-header">
              <span className="registration-voice-dot" />
              <span>녹음 중</span>
              <time>{formatTime(state.elapsed)}</time>
            </span>
            <span className="registration-voice-body">
              <Waveform elapsed={state.elapsed} recording />
              <span className="registration-voice-stop">
                <span />
              </span>
            </span>
          </button>
        )}
        {state.phase === "completed" && (
          <div className="registration-voice-completed">
            <div className="registration-voice-header">
              <span className="registration-voice-dot" />
              <time>
                {formatTime(state.playing ? state.position : state.elapsed)}
              </time>
              <button
                className="registration-voice-again"
                type="button"
                onClick={clear}
              >
                <img src="/assets/ic_refresh.svg" alt="" />
                다시 녹음
              </button>
            </div>
            <div className="registration-voice-body">
              <button
                ref={primaryButton}
                className="registration-voice-play"
                type="button"
                onClick={togglePlayback}
                aria-label={state.playing ? "재생 시연 일시 정지" : "재생 시연"}
              >
                <PlaybackIcon playing={state.playing} />
              </button>
              <Waveform
                elapsed={state.elapsed}
                progress={state.position / state.elapsed}
              />
            </div>
          </div>
        )}
      </div>
      <span className="registration-voice-support" aria-hidden="true" />
    </div>
  );
}
