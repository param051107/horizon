// components/Header.jsx
import React, { useState } from "react";
import { getLevelInfo } from "../logic/xp.js";
import "./Header.css";

export default function Header({ stats, levelInfo, xpTotal, dispatch, state }) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-mark">◈</span>
          <span className="logo-text">Mapify</span>
        </div>
        <div className="stats-row">
          <StatPill
            label="Nodes"
            value={stats.total}
            color="var(--text-secondary)"
          />
          <StatPill
            label="Complete"
            value={`${stats.complete}/${stats.total}`}
            color="var(--complete-fg)"
          />
          <StatPill
            label="In Progress"
            value={stats.inProgress}
            color="var(--in-progress-fg)"
          />
          <div className="traversal-badge">
            <span className="traversal-pct">{stats.traversalDepth}%</span>
            <span className="traversal-label">traversal depth</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* XP & Level */}
        <div className="xp-widget">
          <div className="level-badge" style={{ color: levelInfo.color }}>
            <span className="level-num">Lv.{levelInfo.level}</span>
            <span className="level-title">{levelInfo.title}</span>
          </div>
          <div className="xp-bar-wrap">
            <div className="xp-bar-track">
              <div
                className="xp-bar-fill"
                style={{
                  width: `${levelInfo.progressToNext}%`,
                  background: levelInfo.color,
                }}
              />
            </div>
            <span className="xp-label">{xpTotal} XP</span>
          </div>
        </div>

        <button
          className="header-btn"
          onClick={() => setShowHelp((h) => !h)}
          title="Keyboard shortcuts"
        >
          ?
        </button>

        <button
          className="header-btn danger"
          onClick={() => {
            if (confirm("Reset to demo graph? All progress will be lost.")) {
              dispatch({ type: "RESET" });
            }
          }}
          title="Reset graph"
        >
          ↺
        </button>
      </div>

      {showHelp && (
        <div className="help-modal" onClick={() => setShowHelp(false)}>
          <div className="help-content" onClick={(e) => e.stopPropagation()}>
            <h3>Keyboard & Mouse Shortcuts</h3>
            <div className="shortcut-grid">
              <kbd>Double-click canvas</kbd>
              <span>Create new node</span>
              <kbd>Drag node border</kbd>
              <span>Draw dependency edge</span>
              <kbd>Click node</kbd>
              <span>Select & open panel</span>
              <kbd>Del / Backspace</kbd>
              <span>Delete selected node</span>
              <kbd>Scroll</kbd>
              <span>Zoom in/out</span>
              <kbd>Middle-drag / Space+drag</kbd>
              <span>Pan canvas</span>
              <kbd>Ctrl+Z</kbd>
              <span>Coming soon...</span>
            </div>
            <button className="close-btn" onClick={() => setShowHelp(false)}>
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div className="stat-pill">
      <span className="stat-value" style={{ color }}>
        {value}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
