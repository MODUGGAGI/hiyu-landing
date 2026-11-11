import React, { useId } from "react";

// Geometry, paint order and ARGB colors from SoapBubble.kt on app main
// b026be8b682a88d45acc609d36bca4cd157e987a. The app draws in 112×112 units.
const sweepStops = [
  [0, "#F9FFFF"],
  [0.02, "#F9FFFF"],
  [0.17, "#A7D8F5"],
  [0.29, "#D6CBFF"],
  [0.42, "#FFDDDD"],
  [0.5, "#D9D9FF"],
  [0.6, "#A5DDEF"],
  [0.72, "#E4FFDD"],
  [0.86, "#D8FBFF"],
  [0.96, "#FFFFFF"],
  [1, "#FFFFFF"],
];
// Compose's sweep starts on +X. CSS starts on -Y, so its start is +90°.
const sweepGradient = `conic-gradient(from 90deg at 50% 50% in srgb, ${sweepStops
  .map(([offset, color]) => `${color} ${offset * 100}%`)
  .join(", ")})`;
const arcs = [
  { color: "#FFFFFF", alpha: 0x99 / 255, start: 135 },
  { color: "#FFFFFF", alpha: 0x99 / 255, start: 225 },
  { color: "#C0CEFF", alpha: 0x4d / 255, start: -45 },
  { color: "#FFFFFF", alpha: 0x12 / 255, start: 45 },
];
function quarterArc(start) {
  const point = (angle) => {
    const radians = (angle * Math.PI) / 180;
    return `${56 + 51 * Math.cos(radians)} ${56 + 51 * Math.sin(radians)}`;
  };
  return `M ${point(start)} A 51 51 0 0 1 ${point(start + 90)}`;
}

export default function AppSoapBubble({ className }) {
  const id = `app-bubble-${useId().replaceAll(":", "")}`;
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="112"
      height="112"
      viewBox="0 0 112 112"
      fill="none"
      overflow="visible"
      colorInterpolation="sRGB"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient
          id={`${id}-white`}
          gradientUnits="userSpaceOnUse"
          cx="30"
          cy="24"
          r="54"
        >
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0xac / 255} />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0x48 / 255} />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id={`${id}-blue`}
          gradientUnits="userSpaceOnUse"
          cx="25"
          cy="91"
          r="70"
        >
          <stop offset="0" stopColor="#95E3F0" stopOpacity={0x44 / 255} />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id={`${id}-pink`}
          gradientUnits="userSpaceOnUse"
          cx="90"
          cy="76"
          r="74"
        >
          <stop offset="0" stopColor="#FFB8E3" stopOpacity={0x30 / 255} />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <mask
          id={`${id}-rim`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="112"
          height="112"
        >
          <circle cx="56" cy="56" r="54.5" stroke="white" strokeWidth="3" />
        </mask>
      </defs>
      <circle cx="56" cy="56" r="55" fill="#EAFBFF" fillOpacity={0x24 / 255} />
      <circle cx="56" cy="56" r="55" fill={`url(#${id}-white)`} />
      <circle cx="56" cy="56" r="55" fill={`url(#${id}-blue)`} />
      <circle cx="56" cy="56" r="55" fill={`url(#${id}-pink)`} />
      <circle
        cx="56"
        cy="56"
        r="55.3"
        stroke="#7699A1"
        strokeOpacity={0x53 / 255}
        strokeWidth="0.65"
      />
      <g transform="rotate(-70 56 56)" opacity="0.94">
        {/* SVG has no sweep gradient. Keep the app's stops in a masked CSS conic. */}
        <foreignObject
          x="0"
          y="0"
          width="112"
          height="112"
          mask={`url(#${id}-rim)`}
        >
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            style={{ width: 112, height: 112, backgroundImage: sweepGradient }}
          />
        </foreignObject>
      </g>
      <g transform="rotate(-17 56 56)">
        {arcs.map(({ color, alpha, start }) => (
          <path
            key={start}
            d={quarterArc(start)}
            stroke={color}
            strokeOpacity={alpha}
            strokeWidth="1.4"
          />
        ))}
      </g>
      <circle
        cx="56"
        cy="56"
        r="59"
        stroke="#EFFAFF"
        strokeOpacity={0x85 / 255}
        strokeWidth="0.7"
      />
      <ellipse
        cx="31.5"
        cy="15"
        rx="15.5"
        ry="4"
        fill="white"
        fillOpacity="0.92"
        transform="rotate(-42 31.5 15)"
      />
      <ellipse
        cx="12.5"
        cy="38.5"
        rx="2.5"
        ry="7.5"
        fill="white"
        fillOpacity="0.75"
        transform="rotate(15 12.5 38.5)"
      />
      <ellipse
        cx="85.5"
        cy="93.5"
        rx="14.5"
        ry="2.5"
        fill="white"
        fillOpacity="0.83"
        transform="rotate(-44 85.5 93.5)"
      />
    </svg>
  );
}
