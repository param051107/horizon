// components/Minimap.jsx
import React, { useRef, useCallback } from "react";
import "./Minimap.css";

const MM_W = 180;
const MM_H = 110;
const NODE_W = 120;
const NODE_H = 60;
const PAD = 40;

const STATE_COLORS = {
  locked: "#3a3a52",
  unlocked: "#2a6090",
  "in-progress": "#8a5020",
  complete: "#1a7040",
};

export default function Minimap({ nodes, viewport, dispatch }) {
  const mmRef = useRef(null);

  const nodeList = Object.values(nodes);
  if (nodeList.length === 0) return null;

  // Compute world bounds
  const xs = nodeList.map((n) => n.x);
  const ys = nodeList.map((n) => n.y);
  const minX = Math.min(...xs) - PAD;
  const minY = Math.min(...ys) - PAD;
  const maxX = Math.max(...xs) + NODE_W + PAD;
  const maxY = Math.max(...ys) + NODE_H + PAD;
  const worldW = maxX - minX;
  const worldH = maxY - minY;

  const scaleX = MM_W / worldW;
  const scaleY = MM_H / worldH;
  const scale = Math.min(scaleX, scaleY, 1);

  const toMM = (wx, wy) => ({
    x: (wx - minX) * scale,
    y: (wy - minY) * scale,
  });

  // Viewport rect in world coordinates
  const svgW = window.innerWidth - 160 - 380; // approximate
  const svgH = window.innerHeight - 52;

  const vWorldX = -viewport.x / viewport.zoom;
  const vWorldY = -viewport.y / viewport.zoom;
  const vWorldW = svgW / viewport.zoom;
  const vWorldH = svgH / viewport.zoom;

  const vpMM = toMM(vWorldX, vWorldY);
  const vpW = vWorldW * scale;
  const vpH = vWorldH * scale;

  const handleMMClick = useCallback(
    (e) => {
      if (!mmRef.current) return;
      const rect = mmRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Convert MM click to world
      const wx = mx / scale + minX;
      const wy = my / scale + minY;

      // Center viewport on this point
      const svgW2 = window.innerWidth - 160 - 380;
      const svgH2 = window.innerHeight - 52;
      dispatch({
        type: "SET_VIEWPORT",
        viewport: {
          x: -(wx * viewport.zoom) + svgW2 / 2,
          y: -(wy * viewport.zoom) + svgH2 / 2,
          zoom: viewport.zoom,
        },
      });
    },
    [scale, minX, minY, viewport, dispatch],
  );

  return (
    <div className="minimap">
      <div className="minimap-label">Overview</div>
      <svg
        ref={mmRef}
        width={MM_W}
        height={MM_H}
        onClick={handleMMClick}
        style={{ cursor: "crosshair" }}
      >
        {/* Background */}
        <rect width={MM_W} height={MM_H} fill="var(--bg-void)" />

        {/* Nodes */}
        {nodeList.map((n) => {
          const pos = toMM(n.x, n.y);
          return (
            <rect
              key={n.id}
              x={pos.x}
              y={pos.y}
              width={NODE_W * scale}
              height={NODE_H * scale}
              rx="2"
              fill={STATE_COLORS[n.state] || "#3a3a52"}
              opacity="0.85"
            />
          );
        })}

        {/* Viewport indicator */}
        <rect
          x={Math.max(0, vpMM.x)}
          y={Math.max(0, vpMM.y)}
          width={Math.min(vpW, MM_W)}
          height={Math.min(vpH, MM_H)}
          fill="rgba(255,107,53,0.08)"
          stroke="var(--accent)"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
      </svg>
      <div className="minimap-zoom">{Math.round(viewport.zoom * 100)}%</div>
    </div>
  );
}
