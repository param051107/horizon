import { v4 as uuidv4 } from "uuid";
import { wouldCreateCycle, recomputeUnlockStates } from "./dag";

export function reducer(state, action) {
  switch (action.type) {
    // ─────────────────────────────
    // NODE
    // ─────────────────────────────
    case "ADD_NODE": {
      const id = uuidv4();

      const newNode = {
        id,
        title: "New Skill",
        x: action.x,
        y: action.y,
        state: "locked",
        progress: 0,
        createdAt: Date.now(),
        resources: [],
        cluster: null,
      };

      const nodes = {
        ...state.nodes,
        [id]: newNode,
      };

      return {
        ...state,
        nodes: recomputeUnlockStates(nodes, state.edges),
      };
    }

    case "DELETE_NODE": {
      const nodes = { ...state.nodes };
      delete nodes[action.id];

      const edges = state.edges.filter(
        (e) => e.from !== action.id && e.to !== action.id,
      );

      return {
        ...state,
        nodes: recomputeUnlockStates(nodes, edges),
        edges,
      };
    }

    case "MOVE_NODE": {
      const snap = state.settings.snapGrid;
      const grid = state.settings.gridSize;

      const x = snap ? Math.round(action.x / grid) * grid : action.x;
      const y = snap ? Math.round(action.y / grid) * grid : action.y;

      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.id]: {
            ...state.nodes[action.id],
            x,
            y,
          },
        },
      };
    }

    case "UPDATE_NODE": {
      const nodes = {
        ...state.nodes,
        [action.id]: {
          ...state.nodes[action.id],
          ...action.changes,
        },
      };

      return {
        ...state,
        nodes: recomputeUnlockStates(nodes, state.edges),
      };
    }

    // ─────────────────────────────
    // EDGE
    // ─────────────────────────────
    case "ADD_EDGE": {
      if (action.from === action.to) return state;

      if (state.edges.some((e) => e.from === action.from && e.to === action.to))
        return state;

      if (wouldCreateCycle(state.nodes, state.edges, action.from, action.to)) {
        console.warn("Cycle prevented");
        return state;
      }

      const newEdge = {
        id: uuidv4(),
        from: action.from,
        to: action.to,
        label: action.label || "requires",
      };

      const edges = [...state.edges, newEdge];

      return {
        ...state,
        edges,
        nodes: recomputeUnlockStates(state.nodes, edges),
      };
    }

    case "DELETE_EDGE": {
      const edges = state.edges.filter((e) => e.id !== action.id);

      return {
        ...state,
        edges,
        nodes: recomputeUnlockStates(state.nodes, edges),
      };
    }

    // ─────────────────────────────
    // CLUSTERS (PHASE / MODULE)
    // ─────────────────────────────
    case "ADD_CLUSTER": {
      return {
        ...state,
        clusters: {
          ...state.clusters,
          [action.id]: {
            id: action.id,
            label: action.label,
            color: action.color,
          },
        },
      };
    }

    case "DELETE_CLUSTER": {
      const clusters = { ...state.clusters };
      delete clusters[action.id];

      const nodes = { ...state.nodes };
      Object.values(nodes).forEach((n) => {
        if (n.cluster === action.id) {
          n.cluster = null;
        }
      });

      return {
        ...state,
        clusters,
        nodes,
      };
    }

    case "ASSIGN_CLUSTER": {
      const nodes = { ...state.nodes };

      action.nodeIds.forEach((id) => {
        if (nodes[id]) {
          nodes[id] = {
            ...nodes[id],
            cluster: action.clusterId,
          };
        }
      });

      return {
        ...state,
        nodes,
      };
    }

    // ─────────────────────────────
    // VIEWPORT
    // ─────────────────────────────
    case "SET_VIEWPORT":
      return {
        ...state,
        viewport: action.viewport,
      };

    // ─────────────────────────────
    // SETTINGS
    // ─────────────────────────────
    case "TOGGLE_SETTING":
      return {
        ...state,
        settings: {
          ...state.settings,
          [action.key]: !state.settings[action.key],
        },
      };

    // ─────────────────────────────
    // TEMPLATE SYSTEM (🔥 IMPORTANT)
    // ─────────────────────────────
    case "LOAD_TEMPLATE": {
      const tpl = action.template;

      if (!tpl) return state;

      return {
        ...state,
        nodes: tpl.nodes || {},
        edges: tpl.edges || [],
        clusters: tpl.clusters || {},
        selectedNode: null,
      };
    }

    // ─────────────────────────────
    // RESET
    // ─────────────────────────────
    case "RESET":
      return action.payload;

    // ─────────────────────────────
    // DEFAULT
    // ─────────────────────────────
    default:
      return state;
  }
}
