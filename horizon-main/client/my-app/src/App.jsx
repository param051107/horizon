// App.jsx — Root component with full state machine
import React, {
  useReducer,
  useEffect,
  useRef,
  useCallback,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { loadState, saveState, getDefaultState } from "./logic/storage.js";
import {
  recomputeUnlockStates,
  wouldCreateCycle,
  computeStats,
  suggestNextNode,
} from "./logic/dag.js";
import { XP_REWARDS, getLevelInfo, checkNewBadges } from "./logic/xp.js";
import Canvas from "../src/assets/Canvas.jsx";
import Toolbar from "../src/assets/Toolbar.jsx";
import NodePanel from "../src/assets/NodePanel.jsx";
import Header from "../src/assets/Header.jsx";
import Minimap from "../src/assets/Minimap.jsx";
import XPToast from "../src/assets/XPToast.jsx";
import BadgeToast from "../src/assets/BadgeToast.jsx";
import "../src/App.css";

import { reducer } from "./logic/reducer.js";


// ─── Reducer ────────────────────────────────────────────────────────────────

function dagReducer(state, action) {
  switch (action.type) {
    case "LOAD_TEMPLATE": {
      const tpl = action.template;
      if (!tpl) return state;

      return {
        ...state,
        nodes: recomputeUnlockStates(tpl.nodes || {}, tpl.edges || []),
        edges: tpl.edges || [],
        clusters: tpl.clusters || {},
        selectedNode: null,
        cycleError: null,
      };
    }
    
    case "ADD_NODE": {
      const id = "node-" + uuidv4().slice(0, 8);
      const newNode = {
        id,
        title: "New Skill",
        state: "unlocked",
        x: action.x,
        y: action.y,
        notes: "",
        timeEstimate: "",
        resources: [],
        cluster: null,
        progress: 0,
        xp: 0,
        createdAt: Date.now(),
        completedAt: null,
      };
      const nodes = recomputeUnlockStates(
        { ...state.nodes, [id]: newNode },
        state.edges,
      );
      return {
        ...state,
        nodes,
        selectedNode: id,
        xpTotal: state.xpTotal + XP_REWARDS.addNode,
      };
    }

    case "UPDATE_NODE": {
      const { id, changes } = action;
      const oldNode = state.nodes[id];
      if (!oldNode) return state;

      let xpGain = 0;
      let updatedNode = { ...oldNode, ...changes };

      // XP for state transitions
      if (changes.state && changes.state !== oldNode.state) {
        if (changes.state === "in-progress") xpGain += XP_REWARDS.startNode;
        if (changes.state === "complete") {
          xpGain += XP_REWARDS.completeNode;
          updatedNode.completedAt = Date.now();
          updatedNode.progress = 100;
          updatedNode.xp = XP_REWARDS.completeNode;
        }
      }

      const nodes = recomputeUnlockStates(
        { ...state.nodes, [id]: updatedNode },
        state.edges,
      );

      return { ...state, nodes, xpTotal: state.xpTotal + xpGain };
    }

    case "DELETE_CLUSTER": {
      const { clusterId } = action;

      // Remove cluster
      const { [clusterId]: _, ...rest } = state.clusters;

      // Unassign nodes
      const nodes = { ...state.nodes };
      Object.keys(nodes).forEach((id) => {
        if (nodes[id].cluster === clusterId) {
          nodes[id] = { ...nodes[id], cluster: null };
        }
      });

      return { ...state, clusters: rest, nodes };
    }

    case "UPDATE_CLUSTER": {
      const { id, changes } = action;
      return {
        ...state,
        clusters: {
          ...state.clusters,
          [id]: { ...state.clusters[id], ...changes },
        },
      };
    }

    case "DELETE_NODE": {
      const { id } = action;
      const { [id]: _, ...rest } = state.nodes;
      const edges = state.edges.filter((e) => e.from !== id && e.to !== id);
      const nodes = recomputeUnlockStates(rest, edges);
      return {
        ...state,
        nodes,
        edges,
        selectedNode: state.selectedNode === id ? null : state.selectedNode,
      };
    }

    case "ADD_EDGE": {
      const { from, to, label } = action;
      if (from === to) return state;
      if (state.edges.some((e) => e.from === from && e.to === to)) return state;
      if (wouldCreateCycle(state.nodes, state.edges, from, to)) {
        return {
          ...state,
          cycleError: `Edge ${from}→${to} would create a cycle!`,
        };
      }
      const edge = {
        id: "e-" + uuidv4().slice(0, 8),
        from,
        to,
        label: label || "requires",
      };
      const edges = [...state.edges, edge];
      const nodes = recomputeUnlockStates(state.nodes, edges);
      return {
        ...state,
        nodes,
        edges,
        cycleError: null,
        xpTotal: state.xpTotal + XP_REWARDS.addEdge,
      };
    }

    case "DELETE_EDGE": {
      const edges = state.edges.filter((e) => e.id !== action.id);
      const nodes = recomputeUnlockStates(state.nodes, edges);
      return { ...state, nodes, edges };
    }

    case "MOVE_NODE": {
      const { id, x, y } = action;
      const snap = state.settings.snapGrid;
      const grid = state.settings.gridSize;
      const sx = snap ? Math.round(x / grid) * grid : x;
      const sy = snap ? Math.round(y / grid) * grid : y;
      return {
        ...state,
        nodes: { ...state.nodes, [id]: { ...state.nodes[id], x: sx, y: sy } },
      };
    }

    case "SELECT_NODE":
      return { ...state, selectedNode: action.id };

    case "SET_VIEWPORT":
      return { ...state, viewport: action.viewport };

    case "CLEAR_CYCLE_ERROR":
      return { ...state, cycleError: null };

    case "ADD_RESOURCE": {
      const { nodeId, resource } = action;
      const node = state.nodes[nodeId];
      if (!node) return state;
      const resources = [
        ...(node.resources || []),
        { id: uuidv4().slice(0, 8), ...resource },
      ];
      const nodes = { ...state.nodes, [nodeId]: { ...node, resources } };
      return {
        ...state,
        nodes,
        xpTotal: state.xpTotal + XP_REWARDS.addResource,
      };
    }

    case "DELETE_RESOURCE": {
      const { nodeId, resourceId } = action;
      const node = state.nodes[nodeId];
      if (!node) return state;
      const resources = (node.resources || []).filter(
        (r) => r.id !== resourceId,
      );
      const nodes = { ...state.nodes, [nodeId]: { ...node, resources } };
      return { ...state, nodes };
    }

    case "ADD_CLUSTER": {
      const { id, label, color } = action;
      return {
        ...state,
        clusters: { ...state.clusters, [id]: { id, label, color } },
      };
    }

    case "ASSIGN_CLUSTER": {
      const { nodeIds, clusterId } = action;
      const nodes = { ...state.nodes };
      nodeIds.forEach((id) => {
        if (nodes[id]) nodes[id] = { ...nodes[id], cluster: clusterId };
      });
      return { ...state, nodes };
    }

    case "TOGGLE_SETTING": {
      return {
        ...state,
        settings: {
          ...state.settings,
          [action.key]: !state.settings[action.key],
        },
      };
    }

    case "EARN_BADGE": {
      const earned = [...(state.earnedBadges || []), action.badgeId];
      return { ...state, earnedBadges: earned };
    }

    case "RESET":
      return getDefaultState();

    default:
      return state;
  }
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const initial = loadState() || getDefaultState();
  const [state, dispatch] = useReducer(dagReducer, {
    ...initial,
    earnedBadges: initial.earnedBadges || [],
  });

  const [xpToasts, setXpToasts] = useState([]);
  const [badgeToasts, setBadgeToasts] = useState([]);
  const prevXp = useRef(state.xpTotal);
  const prevBadges = useRef(state.earnedBadges || []);

  // Persist on every state change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // XP toast
  useEffect(() => {
    const diff = state.xpTotal - prevXp.current;
    if (diff > 0) {
      const toast = { id: Date.now(), amount: diff };
      setXpToasts((t) => [...t, toast]);
      setTimeout(
        () => setXpToasts((t) => t.filter((x) => x.id !== toast.id)),
        2200,
      );
    }
    prevXp.current = state.xpTotal;
  }, [state.xpTotal]);

  // Badge detection
  useEffect(() => {
    const newBadges = checkNewBadges(state, state.earnedBadges);
    newBadges.forEach((badge) => {
      dispatch({ type: "EARN_BADGE", badgeId: badge.id });
      setBadgeToasts((t) => [
        ...t,
        { ...badge, toastId: Date.now() + Math.random() },
      ]);
    });
  }, [state.nodes, state.edges]);

  const stats = computeStats(state.nodes, state.edges);
  const levelInfo = getLevelInfo(state.xpTotal);
  const suggestion = suggestNextNode(state.nodes, state.edges);

  return (
    <div className="app-root">
      <Header
        stats={stats}
        levelInfo={levelInfo}
        xpTotal={state.xpTotal}
        dispatch={dispatch}
        state={state}
      />
      <div className="app-body">
        <Toolbar
          dispatch={dispatch}
          settings={state.settings}
          suggestion={suggestion}
          state={state}
        />
        <div className="canvas-container">
          <Canvas
            nodes={state.nodes}
            edges={state.edges}
            clusters={state.clusters}
            viewport={state.viewport}
            selectedNode={state.selectedNode}
            settings={state.settings}
            cycleError={state.cycleError}
            dispatch={dispatch}
          />
          {state.settings.showMinimap && (
            <Minimap
              nodes={state.nodes}
              viewport={state.viewport}
              dispatch={dispatch}
            />
          )}
        </div>
        {state.selectedNode && state.nodes[state.selectedNode] && (
          <NodePanel
            node={state.nodes[state.selectedNode]}
            clusters={state.clusters}
            dispatch={dispatch}
            onClose={() => dispatch({ type: "SELECT_NODE", id: null })}
          />
        )}
      </div>

      {/* XP Toasts */}
      <div className="toast-layer">
        {xpToasts.map((t) => (
          <XPToast key={t.id} amount={t.amount} />
        ))}
      </div>

      {/* Badge Toasts */}
      <div className="badge-toast-layer">
        {badgeToasts.map((b, i) => (
          <BadgeToast
            key={b.toastId}
            badge={b}
            index={i}
            onDone={() =>
              setBadgeToasts((t) => t.filter((x) => x.toastId !== b.toastId))
            }
          />
        ))}
      </div>

      {/* Cycle error */}
      {state.cycleError && (
        <div
          className="cycle-error-banner"
          onClick={() => dispatch({ type: "CLEAR_CYCLE_ERROR" })}
        >
          ⚠️ {state.cycleError} — Click to dismiss
        </div>
      )}
    </div>
  );
}
