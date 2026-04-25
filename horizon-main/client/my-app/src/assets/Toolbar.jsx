// components/Toolbar.jsx
import React, { useState } from "react";
import "./Toolbar.css";
import { TEMPLATES } from "../logic/templates";

const TOOLS = [
  { id: "select", icon: "◻", label: "Select", shortcut: "V" },
  { id: "edge", icon: "→", label: "Draw Edge", shortcut: "E" },
  { id: "lasso", icon: "⬡", label: "Lasso", shortcut: "L" },
];

export default function Toolbar({ dispatch, settings, suggestion }) {
  const [activeTool, setActiveTool] = useState("select");

  // ── Export ─────────────────────────────────────────
  const handleExport = () => {
    const canvas = document.querySelector(".dag-canvas-svg");
    if (!canvas) return;

    const svgData = new XMLSerializer().serializeToString(canvas);
    const blob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = canvas.clientWidth || 1600;
      c.height = canvas.clientHeight || 900;

      const ctx = c.getContext("2d");
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);

      const a = document.createElement("a");
      a.download = "skilldag-export.png";
      a.href = c.toDataURL("image/png");
      a.click();

      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  // ── Template Load ──────────────────────────────────
  const handleLoadTemplate = (key, getTemplate) => {
    if (typeof getTemplate !== "function") return;

    const ok = confirm(
      `Load "${formatLabel(key)}" template?\nThis will replace your current graph.`,
    );
    if (!ok) return;

    const tpl = getTemplate();
    if (!tpl) return;

    dispatch({
      type: "LOAD_TEMPLATE",
      template: tpl,
    });
  };

  return (
    <div className="toolbar">
      {/* ── Tools ───────────────────────── */}
      <div className="toolbar-section">
        <div className="section-label">Tools</div>

        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={`tool-btn ${activeTool === tool.id ? "active" : ""}`}
            onClick={() => setActiveTool(tool.id)}
            title={`${tool.label} (${tool.shortcut})`}
          >
            <span className="tool-icon">{tool.icon}</span>
            <span className="tool-label">{tool.label}</span>
          </button>
        ))}
      </div>

      <div className="toolbar-divider" />

      {/* ── Settings ───────────────────── */}
      <div className="toolbar-section">
        <div className="section-label">Settings</div>

        <ToggleRow
          label="Snap Grid"
          active={settings.snapGrid}
          onClick={() => dispatch({ type: "TOGGLE_SETTING", key: "snapGrid" })}
        />

        <ToggleRow
          label="Minimap"
          active={settings.showMinimap}
          onClick={() =>
            dispatch({ type: "TOGGLE_SETTING", key: "showMinimap" })
          }
        />

        <ToggleRow
          label="Animations"
          active={settings.animationsEnabled}
          onClick={() =>
            dispatch({ type: "TOGGLE_SETTING", key: "animationsEnabled" })
          }
        />
      </div>

      <div className="toolbar-divider" />

      {/* ── Suggestion ─────────────────── */}
      {suggestion && (
        <>
          <div className="toolbar-section">
            <div className="section-label">Suggested Next</div>

            <div
              className="suggestion-card"
              onClick={() =>
                dispatch({ type: "SELECT_NODE", id: suggestion.id })
              }
            >
              <span className="suggest-icon">💡</span>
              <div className="suggest-info">
                <div className="suggest-title">{suggestion.title}</div>
                <div className="suggest-sub">Highest unlock leverage</div>
              </div>
            </div>
          </div>

          <div className="toolbar-divider" />
        </>
      )}

      {/* ── Templates ─────────────────── */}
      <div className="toolbar-section">
        <div className="section-label">Templates</div>

        {TEMPLATES && Object.keys(TEMPLATES).length > 0 ? (
          Object.entries(TEMPLATES).map(([key, getTemplate]) => (
            <button
              key={key}
              className="template-btn"
              onClick={() => handleLoadTemplate(key, getTemplate)}
            >
              <span className="template-icon">📦</span>
              <span className="template-label">{formatLabel(key)}</span>
            </button>
          ))
        ) : (
          <div className="no-templates">No templates available</div>
        )}
      </div>

      <div className="toolbar-spacer" />

      {/* ── Export ─────────────────────── */}
      <div className="toolbar-section">
        <button
          className="export-btn"
          onClick={handleExport}
          title="Export as PNG"
        >
          <span>⬆</span> Export
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// Toggle Component
// ─────────────────────────────────────
function ToggleRow({ label, active, onClick }) {
  return (
    <button className={`toggle-row ${active ? "on" : "off"}`} onClick={onClick}>
      <span className="toggle-label">{label}</span>
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
    </button>
  );
}

// ─────────────────────────────────────
// Label Formatter
// ─────────────────────────────────────
function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (s) => s.toUpperCase());
}
