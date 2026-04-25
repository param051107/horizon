// components/SkillNode.jsx
import React, { useState, useRef } from "react";

const NODE_W = 120;
const NODE_H = 60;
const NODE_RX = 10;

const STATE_CONFIG = {
  locked: {
    bg: "var(--locked)",
    fg: "var(--locked-fg)",
    border: "#3a3a52",
    glow: "var(--locked-glow)",
    icon: "🔒",
    borderWidth: 1,
  },
  unlocked: {
    bg: "var(--unlocked)",
    fg: "var(--unlocked-fg)",
    border: "#2a6090",
    glow: "var(--unlocked-glow)",
    icon: "◈",
    borderWidth: 1.5,
  },
  "in-progress": {
    bg: "var(--in-progress)",
    fg: "var(--in-progress-fg)",
    border: "#8a5020",
    glow: "var(--in-progress-glow)",
    icon: "⟳",
    borderWidth: 2,
  },
  complete: {
    bg: "var(--complete)",
    fg: "var(--complete-fg)",
    border: "#1a7040",
    glow: "var(--complete-glow)",
    icon: "✓",
    borderWidth: 1.5,
  },
};

export default function SkillNode({
  node,
  isSelected,
  isHovered,
  isDragging,
  isDrawingFrom,
  isDrawingTarget,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onEdgePortDrag,
  dispatch,
}) {
  const cfg = STATE_CONFIG[node.state] || STATE_CONFIG.locked;
  const [showStateMenu, setShowStateMenu] = useState(false);
  const portRef = useRef(null);

  const glow = isSelected
    ? `drop-shadow(0 0 12px ${cfg.glow}) drop-shadow(0 0 6px ${cfg.glow})`
    : isHovered
      ? `drop-shadow(0 0 8px ${cfg.glow})`
      : isDrawingTarget
        ? `drop-shadow(0 0 16px var(--complete-glow))`
        : node.state === "in-progress"
          ? `drop-shadow(0 0 8px ${cfg.glow})`
          : "none";

  const handleStateClick = (e) => {
    e.stopPropagation();
    setShowStateMenu((s) => !s);
  };

  const setNodeState = (e, newState) => {
    e.stopPropagation();
    dispatch({
      type: "UPDATE_NODE",
      id: node.id,
      changes: { state: newState },
    });
    setShowStateMenu(false);
  };

  const progressAngle = ((node.progress || 0) / 100) * 360;
  const progressArc = describeArc(NODE_W - 14, 14, 8, 0, progressAngle);

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      style={{
        filter: glow,
        cursor: isDragging ? "grabbing" : "grab",
        transition: isDragging ? "none" : "filter 0.2s ease",
        opacity: isDragging ? 0.85 : 1,
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={() => {
        onMouseLeave();
        setShowStateMenu(false);
      }}
    >
      {/* Selected ring */}
      {isSelected && (
        <rect
          x="-3"
          y="-3"
          width={NODE_W + 6}
          height={NODE_H + 6}
          rx={NODE_RX + 3}
          fill="none"
          stroke={cfg.fg}
          strokeWidth="1"
          opacity="0.4"
          strokeDasharray="4 3"
        />
      )}

      {/* Drawing-target ring */}
      {isDrawingTarget && (
        <rect
          x="-5"
          y="-5"
          width={NODE_W + 10}
          height={NODE_H + 10}
          rx={NODE_RX + 5}
          fill="none"
          stroke="var(--complete-fg)"
          strokeWidth="2"
          opacity="0.8"
        />
      )}

      {/* Main body */}
      <rect
        x="0"
        y="0"
        width={NODE_W}
        height={NODE_H}
        rx={NODE_RX}
        fill={cfg.bg}
        stroke={isSelected ? cfg.fg : cfg.border}
        strokeWidth={isSelected ? 2 : cfg.borderWidth}
      />

      {/* Top accent stripe */}
      <rect
        x="0"
        y="0"
        width={NODE_W}
        height="3"
        rx={NODE_RX}
        fill={cfg.fg}
        opacity="0.7"
      />

      {/* In-progress spinner arc */}
      {node.state === "in-progress" && node.progress > 0 && (
        <path
          d={progressArc}
          fill="none"
          stroke={cfg.fg}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.8"
        />
      )}

      {/* Completion circle */}
      {node.state === "complete" && (
        <circle
          cx={NODE_W - 14}
          cy={14}
          r="8"
          fill="var(--complete-fg)"
          opacity="0.9"
        />
      )}

      {/* State icon */}
      <text
        x={NODE_W - 14}
        y={node.state === "complete" ? 18 : 18}
        textAnchor="middle"
        fontSize={node.state === "complete" ? "9" : "10"}
        fill={node.state === "complete" ? "var(--bg-void)" : cfg.fg}
        fontFamily="var(--font-display)"
        fontWeight="700"
      >
        {node.state === "complete"
          ? "✓"
          : node.state === "in-progress"
            ? "…"
            : node.state === "unlocked"
              ? "◈"
              : "⊘"}
      </text>

      {/* Node title */}
      <text
        x="10"
        y="22"
        fontSize="10"
        fontWeight="600"
        fill={cfg.fg}
        fontFamily="var(--font-display)"
        letterSpacing="0.02em"
      >
        {truncate(node.title, 14)}
      </text>

      {/* Time estimate */}
      {node.timeEstimate && (
        <text
          x="10"
          y="36"
          fontSize="8.5"
          fill={cfg.fg}
          opacity="0.55"
          fontFamily="var(--font-mono)"
        >
          ⏱ {node.timeEstimate}
        </text>
      )}

      {/* Resource count */}
      {node.resources?.length > 0 && (
        <text
          x="10"
          y="50"
          fontSize="8"
          fill={cfg.fg}
          opacity="0.45"
          fontFamily="var(--font-mono)"
        >
          📎 {node.resources.length} link
          {node.resources.length !== 1 ? "s" : ""}
        </text>
      )}

      {/* Progress bar (bottom) */}
      {(node.state === "in-progress" || node.state === "complete") && (
        <>
          <rect
            x="0"
            y={NODE_H - 5}
            width={NODE_W}
            height="5"
            rx="0"
            fill="rgba(0,0,0,0.4)"
          />
          <rect
            x="0"
            y={NODE_H - 5}
            width={(NODE_W * (node.progress || 0)) / 100}
            height="5"
            rx="0"
            fill={cfg.fg}
            opacity="0.7"
          />
        </>
      )}

      {/* State-change click target (icon area) */}
      <rect
        x={NODE_W - 28}
        y="4"
        width="24"
        height="24"
        rx="6"
        fill="transparent"
        cursor="pointer"
        onClick={handleStateClick}
      />

      {/* State menu */}
      {showStateMenu && (
        <g>
          <rect
            x={NODE_W + 4}
            y="0"
            width="110"
            height="80"
            rx="8"
            fill="var(--bg-panel)"
            stroke="var(--border-mid)"
            strokeWidth="1"
          />
          {["locked", "unlocked", "in-progress", "complete"].map((s, i) => {
            const sc = STATE_CONFIG[s];
            return (
              <g
                key={s}
                onClick={(e) => setNodeState(e, s)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={NODE_W + 5}
                  y={1 + i * 19}
                  width="108"
                  height="18"
                  rx="5"
                  fill={node.state === s ? sc.bg : "transparent"}
                />
                <text
                  x={NODE_W + 12}
                  y={13 + i * 19}
                  fontSize="9"
                  fill={sc.fg}
                  fontFamily="var(--font-display)"
                  fontWeight={node.state === s ? "700" : "400"}
                >
                  {s === "in-progress"
                    ? "⟳ In Progress"
                    : s === "complete"
                      ? "✓ Complete"
                      : s === "unlocked"
                        ? "◈ Unlocked"
                        : "⊘ Locked"}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Edge drag port (right side) */}
      <circle
        cx={NODE_W + 8}
        cy={NODE_H / 2}
        r="6"
        fill={cfg.bg}
        stroke={cfg.fg}
        strokeWidth="1.5"
        cursor="crosshair"
        opacity={isHovered || isDrawingFrom ? 1 : 0}
        onMouseDown={onEdgePortDrag}
        style={{ transition: "opacity 0.15s" }}
      />
      {(isHovered || isDrawingFrom) && (
        <text
          x={NODE_W + 8}
          y={NODE_H / 2 + 4}
          textAnchor="middle"
          fontSize="8"
          fill={cfg.fg}
          pointerEvents="none"
        >
          →
        </text>
      )}

      {/* XP badge on complete */}
      {node.state === "complete" && node.xp > 0 && (
        <text
          x="10"
          y="50"
          fontSize="8"
          fill="var(--xp-color)"
          opacity="0.6"
          fontFamily="var(--font-mono)"
        >
          +{node.xp}xp
        </text>
      )}
    </g>
  );
}

function truncate(str, len) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  if (endAngle <= 0) return "";
  if (endAngle >= 360) endAngle = 359.99;
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx, cy, r, angle) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
