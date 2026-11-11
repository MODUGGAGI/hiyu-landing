import React, { useEffect, useRef } from "react";
import { ButtonMotion } from "./tap/motion.js";
import { shapes } from "./model.js";
const asset = (name) => `/assets/${name}`;
export function Face({ emotion, source = "figma", className = "", ...props }) {
  return (
    <img
      className={`face ${className}`}
      src={asset(
        source === "app"
          ? `ic_emotion_${emotion.id}.svg`
          : `figma/emotion-${emotion.id}.svg`,
      )}
      alt=""
      draggable="false"
      {...props}
    />
  );
}

export function Stamp({
  shape = shapes[0],
  fill = "#00E5B0",
  label = "",
  textColor = "#22211E",
  size = 160,
  artwork,
  artworkIncludesLabel = false,
}) {
  const ratio = shape.w / shape.h,
    w = ratio >= 1 ? size : size * ratio,
    h = ratio >= 1 ? size / ratio : size;
  const count = Array.from(label).length,
    font = (([28, 28, 24, 20, 16][count] || 16) * size) / 96;
  const narrow = (shape.tw * w) / font < 2.8,
    display =
      count === 4 && narrow
        ? Array.from(label).slice(0, 2).join("") +
          "\n" +
          Array.from(label).slice(2).join("")
        : label;
  return (
    <span
      className="stamp-slot"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="stamp-art" style={{ width: w, height: h }}>
        {artwork ? (
          <img src={artwork} alt="" draggable="false" />
        ) : (
          <>
            <img src={asset(`group_stamp_${shape.id}_backdrop.svg`)} alt="" />
            <span
              className="stamp-fill"
              style={{
                background: fill,
                maskImage: `url(${asset(`group_stamp_${shape.id}_fill.svg`)})`,
              }}
            />
            {shape.overlay && (
              <img src={asset(`group_stamp_${shape.id}_overlay.svg`)} alt="" />
            )}
          </>
        )}
        {!(artwork && artworkIncludesLabel) && (
          <span
            className="stamp-label"
            style={{
              left: `${(shape.cx - shape.tw / 2) * 100}%`,
              top: `${(shape.cy - shape.th / 2) * 100}%`,
              width: `${shape.tw * 100}%`,
              height: `${shape.th * 100}%`,
              fontSize: font,
              color: textColor,
            }}
          >
            {display}
          </span>
        )}
      </span>
    </span>
  );
}

export function TapButton({ emotion, onTap, paused, pulse = 0, artwork, rapid = false, faceStage = 0 }) {
  const button = useRef(),
    surface = useRef(),
    shadow = useRef(),
    controller = useRef(),
    reduced = useRef(paused);
  reduced.current = paused;
  const callback = useRef(onTap);
  callback.current = onTap;
  useEffect(() => {
    controller.current = new ButtonMotion(button.current, surface.current, {
      reducedMotion: () => reduced.current,
      buzzer: !!artwork,
      rapid,
      shadow: shadow.current,
    });
    const release = () => controller.current?.release();
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
      controller.current.destroy();
    };
  }, []);
  useEffect(() => {
    if (pulse > 0 && !paused) {
      controller.current?.tap();
      callback.current(emotion, button.current, null, true);
    }
  }, [pulse]);
  useEffect(() => {
    if (paused) controller.current?.release();
  }, [paused]);
  return (
    <button
      ref={button}
      className={`emotion-button${artwork ? " native-press-button" : ""}`}
      aria-label={`${emotion.name} 감정 보내기`}
      onPointerDown={(e) => {
        if (e.button === 0) controller.current.press();
      }}
      onPointerCancel={() => controller.current.release()}
      onBlur={() => controller.current.release()}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          if (e.repeat) {
            e.preventDefault();
            return;
          }
          controller.current.press();
        }
      }}
      onKeyUp={() => controller.current.release()}
      onClick={(e) => {
        if (e.detail === 0) controller.current.tap();
        onTap(
          emotion,
          e.currentTarget,
          e.detail ? { x: e.clientX, y: e.clientY } : null,
        );
      }}
    >
      <img
        src={artwork ? "/assets/app-v2/press_button_silver_base.svg" : asset("group_emotion_button_base.svg")}
        className="button-base"
        alt=""
      />
      {artwork && <img ref={shadow} className="native-face-shadow" src="/assets/app-v2/press_button_face_shadow.svg" alt="" />}
      <span ref={surface} className="button-surface">
        {artwork ? <img className={`face press-face-art${emotion.id === "exhausted" && faceStage < 4 ? " tired-cap" : ""}${faceStage === 5 ? " burst-cap" : ""}`} src={artwork} alt="" draggable="false" /> : <Face emotion={emotion} source="app" />}
      </span>
    </button>
  );
}

export function MapArt() {
  return (
    <img
      className="map-art"
      src="/assets/figma/map-original.png"
      alt=""
      draggable="false"
      aria-hidden="true"
    />
  );
}
