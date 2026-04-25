// components/NodePanel.jsx
import React, { useState, useEffect, useRef } from "react";
import "./NodePanel.css";

const STATE_CONFIG = {
  locked: { label: "Locked", color: "var(--locked-fg)", bg: "var(--locked)" },
  unlocked: {
    label: "Unlocked",
    color: "var(--unlocked-fg)",
    bg: "var(--unlocked)",
  },
  "in-progress": {
    label: "In Progress",
    color: "var(--in-progress-fg)",
    bg: "var(--in-progress)",
  },
  complete: {
    label: "Complete",
    color: "var(--complete-fg)",
    bg: "var(--complete)",
  },
};

export default function NodePanel({ node, clusters, dispatch, onClose }) {
  const [title, setTitle] = useState(node.title);
  const [notes, setNotes] = useState(node.notes || "");
  const [timeEst, setTimeEst] = useState(node.timeEstimate || "");
  const [progress, setProgress] = useState(node.progress || 0);
  const [newResUrl, setNewResUrl] = useState("");
  const [newResLabel, setNewResLabel] = useState("");
  const [addingRes, setAddingRes] = useState(false);

  // Sync when selected node changes
  useEffect(() => {
    setTitle(node.title);
    setNotes(node.notes || "");
    setTimeEst(node.timeEstimate || "");
    setProgress(node.progress || 0);
    setAddingRes(false);
  }, [node.id]);

  const commit = (changes) => {
    dispatch({ type: "UPDATE_NODE", id: node.id, changes });
  };

  const cfg = STATE_CONFIG[node.state] || STATE_CONFIG.locked;

  const handleAddResource = () => {
    if (!newResUrl.trim()) return;
    dispatch({
      type: "ADD_RESOURCE",
      nodeId: node.id,
      resource: { label: newResLabel || newResUrl, url: newResUrl },
    });
    setNewResUrl("");
    setNewResLabel("");
    setAddingRes(false);
  };

  const clusterList = Object.values(clusters);

  const timeAgo = (ts) => {
    if (!ts) return "—";
    const d = Date.now() - ts;
    if (d < 60000) return "just now";
    if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
    if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
    return `${Math.floor(d / 86400000)}d ago`;
  };

  return (
    <aside
      className="node-panel"
      style={{ animation: "slideInRight 0.22s var(--ease-spring)" }}
    >
      {/* Header */}
      <div
        className="panel-header"
        style={{ borderBottomColor: cfg.color + "44" }}
      >
        <div
          className="panel-state-badge"
          style={{ color: cfg.color, background: cfg.bg }}
        >
          {cfg.label}
        </div>
        <button className="panel-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="panel-body">
        {/* Title */}
        <div className="panel-field">
          <label>Skill Title</label>
          <input
            className="panel-input title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => commit({ title })}
            onKeyDown={(e) => e.key === "Enter" && commit({ title })}
            placeholder="Name this skill…"
            style={{ color: cfg.color }}
          />
        </div>

        {/* State picker */}
        <div className="panel-field">
          <label>State</label>
          <div className="state-picker">
            {Object.entries(STATE_CONFIG).map(([s, sc]) => (
              <button
                key={s}
                className={`state-opt ${node.state === s ? "active" : ""}`}
                style={{
                  color: sc.color,
                  borderColor: node.state === s ? sc.color : "transparent",
                  background: node.state === s ? sc.bg : "var(--bg-hover)",
                }}
                onClick={() => commit({ state: s })}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Progress slider */}
        {(node.state === "in-progress" || node.state === "complete") && (
          <div className="panel-field">
            <label>
              Progress — <span style={{ color: cfg.color }}>{progress}%</span>
            </label>
            <div className="progress-wrap">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                className="progress-slider"
                style={{ "--track-color": cfg.color }}
                onChange={(e) => setProgress(+e.target.value)}
                onMouseUp={() => commit({ progress })}
                onTouchEnd={() => commit({ progress })}
              />
              <div
                className="progress-bar-visual"
                style={{ "--pct": progress + "%", "--color": cfg.color }}
              />
            </div>
          </div>
        )}

        {/* Time estimate */}
        <div className="panel-field">
          <label>Time Estimate</label>
          <input
            className="panel-input"
            value={timeEst}
            onChange={(e) => setTimeEst(e.target.value)}
            onBlur={() => commit({ timeEstimate: timeEst })}
            placeholder="e.g. 20h, 2 weeks"
          />
        </div>

        {/* Cluster */}
        <div className="panel-field">
          <label>Phase / Module</label>
          <select
            className="panel-select"
            value={node.cluster || ""}
            onChange={(e) => {
              dispatch({
                type: "ASSIGN_CLUSTER",
                nodeIds: [node.id],
                clusterId: e.target.value || null,
              });
            }}
          >
            <option value="">— None —</option>
            {clusterList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div className="panel-field">
          <label>Notes & Context</label>
          <textarea
            className="panel-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => commit({ notes })}
            placeholder="Add learning notes, key concepts, context…"
            rows={4}
          />
        </div>

        {/* Resources */}
        <div className="panel-field">
          <div className="field-header-row">
            <label>External Resources</label>
            <button className="add-btn" onClick={() => setAddingRes((a) => !a)}>
              {addingRes ? "✕" : "+ Add"}
            </button>
          </div>

          {addingRes && (
            <div className="add-resource-form">
              <input
                className="panel-input"
                value={newResLabel}
                onChange={(e) => setNewResLabel(e.target.value)}
                placeholder="Label (optional)"
              />
              <input
                className="panel-input"
                value={newResUrl}
                onChange={(e) => setNewResUrl(e.target.value)}
                placeholder="https://..."
                onKeyDown={(e) => e.key === "Enter" && handleAddResource()}
              />
              <button className="confirm-btn" onClick={handleAddResource}>
                Add Link
              </button>
            </div>
          )}

          <div className="resource-list">
            {(node.resources || []).map((r) => (
              <div key={r.id} className="resource-item">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-link"
                >
                  <span className="resource-icon">↗</span>
                  <span className="resource-label">{r.label || r.url}</span>
                </a>
                <button
                  className="resource-delete"
                  onClick={() =>
                    dispatch({
                      type: "DELETE_RESOURCE",
                      nodeId: node.id,
                      resourceId: r.id,
                    })
                  }
                >
                  ✕
                </button>
              </div>
            ))}
            {(!node.resources || node.resources.length === 0) && !addingRes && (
              <div className="no-resources">No resources yet</div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="panel-meta">
          <div className="meta-row">
            <span>Created</span>
            <span>{timeAgo(node.createdAt)}</span>
          </div>
          {node.completedAt && (
            <div className="meta-row">
              <span>Completed</span>
              <span style={{ color: "var(--complete-fg)" }}>
                {timeAgo(node.completedAt)}
              </span>
            </div>
          )}
          {node.xp > 0 && (
            <div className="meta-row">
              <span>XP Earned</span>
              <span style={{ color: "var(--xp-color)" }}>+{node.xp} XP</span>
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          className="delete-node-btn"
          onClick={() => {
            if (confirm(`Delete "${node.title}"?`)) {
              dispatch({ type: "DELETE_NODE", id: node.id });
            }
          }}
        >
          ✕ Delete Node
        </button>
      </div>
      <div className="cluster-actions">
        <button
          onClick={() => {
            const name = prompt("New phase name:");
            if (!name) return;
            dispatch({
              type: "ADD_CLUSTER",
              id: "cluster-" + Date.now(),
              label: name,
              color: "#5ab4ff",
            });
          }}
        >
          + New Phase
        </button>

        {node.cluster && (
          <button
            onClick={() => {
              if (confirm("Delete this phase?")) {
                dispatch({ type: "DELETE_CLUSTER", clusterId: node.cluster });
              }
            }}
          >
            Delete Phase
          </button>
        )}
      </div>
    </aside>
  );
}
