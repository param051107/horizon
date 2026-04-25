// components/EdgePath.jsx
import React, { useState } from "react";

const NODE_W = 120;
const NODE_H = 60;

function getEdgeColor(fromNode, toNode) {
  const state = fromNode?.state;
  if (state === "complete") return "var(--complete-fg)";
  if (state === "in-progress") return "var(--in-progress-fg)";
  if (state === "unlocked") return "var(--unlocked-fg)";
  return "var(--locked-fg)";
}

function getEdgeOpacity(fromNode, toNode, isHighlighted) {
  if (isHighlighted) return 1;
  if (fromNode?.state === "locked") return 0.25;
  return 0.5;
}

export default function EdgePath({
  edge,
  fromNode,
  toNode,
  isHighlighted,
  onDelete,
}) {
  const [hovering, setHovering] = useState(false);

  if (!fromNode || !toNode) return null;

  // Compute control points for a smooth bezier
  const x1 = fromNode.x + NODE_W; // right side of from
  const y1 = fromNode.y + NODE_H / 2;
  const x2 = toNode.x; // left side of to
  const y2 = toNode.y + NODE_H / 2;

  const dx = x2 - x1;
  const dy = y2 - y1;

  // Dynamic control point distance based on dx
  const cpDist = Math.max(Math.abs(dx) * 0.5, 60);
  const cx1 = x1 + cpDist;
  const cy1 = y1;
  const cx2 = x2 - cpDist;
  const cy2 = y2;

  const d = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  const color = getEdgeColor(fromNode, toNode);
  const opacity = getEdgeOpacity(fromNode, toNode, isHighlighted);

  // Midpoint for label
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2 - 10;

  const markerType =
    edge.label === "supports"
      ? "supports"
      : fromNode?.state === "complete"
        ? "complete"
        : fromNode?.state === "in-progress"
          ? "in-progress"
          : fromNode?.state === "unlocked"
            ? "unlocked"
            : "locked";

  const isFlowing =
    fromNode?.state === "complete" || fromNode?.state === "in-progress";

  return (
    <g
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{ cursor: "pointer" }}
    >
      {/* Hit area */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth="16"
        onClick={hovering ? onDelete : undefined}
      />

      {/* Shadow */}
      {(isHighlighted || hovering) && (
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="4"
          opacity="0.1"
          strokeLinecap="round"
        />
      )}

      {/* Main edge */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={isHighlighted || hovering ? 2.5 : 1.5}
        opacity={opacity}
        strokeLinecap="round"
        strokeDasharray={
          edge.label === "supports"
            ? "6 4"
            : fromNode?.state === "locked"
              ? "4 4"
              : "none"
        }
        markerEnd={`url(#arrow-${markerType})`}
        style={
          isFlowing
            ? {
                strokeDasharray: "8 4",
                animation: "dash-flow 1.5s linear infinite",
              }
            : undefined
        }
      />

      {/* Label */}
      {(isHighlighted || hovering) && edge.label && (
        <>
          <rect
            x={midX - 22}
            y={midY - 9}
            width="44"
            height="14"
            rx="4"
            fill="var(--bg-panel)"
            opacity="0.9"
          />
          <text
            x={midX}
            y={midY}
            textAnchor="middle"
            fontSize="8"
            fill={color}
            fontFamily="var(--font-mono)"
            opacity="0.9"
          >
            {edge.label}
          </text>
        </>
      )}

      {/* Delete hint */}
      {hovering && (
        <g onClick={onDelete}>
          <circle cx={midX} cy={midY + 16} r="8" fill="rgba(255,68,68,0.8)" />
          <text
            x={midX}
            y={midY + 20}
            textAnchor="middle"
            fontSize="9"
            fill="white"
            fontWeight="700"
            pointerEvents="none"
          >
            ✕
          </text>
        </g>
      )}
    </g>
  );
}
