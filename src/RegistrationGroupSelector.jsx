import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { Stamp } from "./components.jsx";
import "./registration-group.css";

const GROUP_NAMES = ["없음", "우리의 작은 아지트"];

function DialOption({ index, progress, selected, stamp, buttonRef, onChoose }) {
  // Same polar geometry as main's GroupSelectorContent: radius 316, centerY 445.
  const x = useTransform(
    progress,
    (value) => Math.sin(((index - value) * 18.5 * Math.PI) / 180) * 316,
  );
  const y = useTransform(
    progress,
    (value) => 445 - Math.cos(((index - value) * 18.5 * Math.PI) / 180) * 316,
  );
  const rotate = useTransform(progress, (value) => (index - value) * 9);
  const scale = useTransform(progress, (value) =>
    Math.max(0.82, 1 - Math.abs(index - value) * 0.1),
  );

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      role="radio"
      className="registration-group-option"
      aria-label={GROUP_NAMES[index]}
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      onClick={() => onChoose(index)}
      style={{
        x,
        y,
        rotate,
        scale,
        opacity: selected ? 1 : 0.58,
        zIndex: selected ? 1 : 0,
      }}
    >
      {index === 0 ? (
        <span className="registration-group-none">없음</span>
      ) : (
        <Stamp {...stamp} size={70} />
      )}
    </motion.button>
  );
}

function OpenGroupSelector({ stamp, selected, onSelect, onClose, paused }) {
  const [pending, setPending] = useState(selected ? 1 : 0);
  const progress = useMotionValue(selected ? 1 : 0);
  const reducedMotion = useReducedMotion();
  const quiet = paused || reducedMotion;
  const titleId = useId();
  const helpId = useId();
  const dialog = useRef(null);
  const buttons = useRef([]);
  const initialSelection = useRef(selected ? 1 : 0);
  const callbacks = useRef({ onSelect, onClose });
  callbacks.current = { onSelect, onClose };

  useLayoutEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    buttons.current[initialSelection.current]?.focus({ preventScroll: true });
    return () => {
      if (element?.contains(document.activeElement) && previous?.isConnected) {
        previous.focus({ preventScroll: true });
      }
    };
  }, []);

  useEffect(() => {
    if (quiet) {
      progress.jump(pending);
      return;
    }
    const animation = animate(progress, pending, {
      type: "spring",
      stiffness: 525,
      damping: 40,
    });
    return () => animation.stop();
  }, [pending, progress, quiet]);

  const choose = (index) => {
    const next = Math.max(0, Math.min(1, index));
    setPending(next);
    buttons.current[next]?.focus({ preventScroll: true });
  };

  const close = () => callbacks.current.onClose();
  const complete = () => {
    callbacks.current.onSelect(pending === 1);
    callbacks.current.onClose();
  };

  return (
    <div className="registration-group-layer">
      <motion.div
        className="registration-group-scrim"
        initial={quiet ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: quiet ? 0 : 0.16 }}
        onClick={close}
        aria-hidden="true"
      />
      <motion.div
        ref={dialog}
        className="registration-group-dialog"
        role="dialog"
        aria-labelledby={titleId}
        aria-describedby={helpId}
        initial={quiet ? false : { y: 320 }}
        animate={{ y: 0 }}
        transition={
          quiet
            ? { duration: 0 }
            : { type: "spring", stiffness: 390, damping: 36 }
        }
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            close();
          }
        }}
      >
        <div className="registration-group-arc" aria-hidden="true" />
        <h3 className="registration-group-title" id={titleId}>
          그룹 선택
        </h3>
        <span className="registration-group-pointer" aria-hidden="true" />
        <p className="registration-group-sr" id={helpId}>
          좌우 방향키로 그룹을 고른 뒤 선택 완료를 눌러주세요. Escape 키로 닫을
          수 있어요.
        </p>
        <div
          className="registration-group-options"
          role="radiogroup"
          aria-label="기록을 남길 그룹"
          onKeyDown={(event) => {
            const keys = [
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "Home",
              "End",
            ];
            if (!keys.includes(event.key)) return;
            event.preventDefault();
            event.stopPropagation();
            if (event.key === "Home") choose(0);
            else if (event.key === "End") choose(1);
            else
              choose(
                pending +
                  (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1),
              );
          }}
        >
          {GROUP_NAMES.map((name, index) => (
            <DialOption
              key={name}
              index={index}
              progress={progress}
              selected={pending === index}
              stamp={stamp}
              buttonRef={(node) => {
                buttons.current[index] = node;
              }}
              onChoose={choose}
            />
          ))}
        </div>
        <p className="registration-group-name" aria-live="polite">
          {GROUP_NAMES[pending]}
        </p>
        <button
          type="button"
          className="registration-group-complete app-raised"
          onClick={complete}
        >
          <span className="app-button-content">선택 완료</span>
        </button>
        <button
          type="button"
          className="registration-group-close"
          onClick={close}
        >
          그룹 선택 닫기
        </button>
      </motion.div>
    </div>
  );
}

export default function RegistrationGroupSelector({
  open,
  stamp,
  selected,
  onSelect,
  onClose,
  paused = false,
}) {
  // Remount the draft on each opening; dismissing never commits a pending choice.
  return open ? (
    <OpenGroupSelector {...{ stamp, selected, onSelect, onClose, paused }} />
  ) : null;
}
