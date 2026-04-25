// utils/dag.js — O(V+E) graph algorithms

/**
 * Topological sort + cycle detection via DFS coloring
 * Returns { sorted: [...nodeIds], hasCycle: bool }
 */
export function topoSort(nodes, edges) {
  const WHITE = 0,
    GRAY = 1,
    BLACK = 2;
  const color = {};
  const sorted = [];
  let hasCycle = false;

  Object.keys(nodes).forEach((id) => {
    color[id] = WHITE;
  });

  const adj = buildAdjacency(nodes, edges);

  function dfs(u) {
    if (hasCycle) return;
    color[u] = GRAY;
    for (const v of adj[u] || []) {
      if (!nodes[v]) continue;
      if (color[v] === GRAY) {
        hasCycle = true;
        return;
      }
      if (color[v] === WHITE) dfs(v);
    }
    color[u] = BLACK;
    sorted.unshift(u);
  }

  Object.keys(nodes).forEach((id) => {
    if (color[id] === WHITE) dfs(id);
  });

  return { sorted, hasCycle };
}

/**
 * Check if adding edge (from→to) creates a cycle — O(V+E)
 */
export function wouldCreateCycle(nodes, edges, fromId, toId) {
  // BFS from toId: if we can reach fromId, adding this edge creates a cycle
  const adj = buildAdjacency(nodes, edges);
  const visited = new Set();
  const queue = [toId];

  while (queue.length) {
    const curr = queue.shift();
    if (curr === fromId) return true;
    if (visited.has(curr)) continue;
    visited.add(curr);
    (adj[curr] || []).forEach((n) => {
      if (!visited.has(n)) queue.push(n);
    });
  }
  return false;
}

function buildAdjacency(nodes, edges) {
  const adj = {};
  Object.keys(nodes).forEach((id) => {
    adj[id] = [];
  });
  edges.forEach((e) => {
    if (adj[e.from]) adj[e.from].push(e.to);
  });
  return adj;
}

function buildReverseAdj(nodes, edges) {
  const radj = {};
  Object.keys(nodes).forEach((id) => {
    radj[id] = [];
  });
  edges.forEach((e) => {
    if (radj[e.to]) radj[e.to].push(e.from);
  });
  return radj;
}

/**
 * Recompute lock states for all nodes based on prerequisite completion.
 * A node is unlocked when ALL its predecessors are 'complete'.
 * Returns updated nodes map (immutable).
 */
export function recomputeUnlockStates(nodes, edges) {
  const radj = buildReverseAdj(nodes, edges);
  const updated = {};

  Object.entries(nodes).forEach(([id, node]) => {
    const preds = radj[id] || [];

    if (preds.length === 0) {
      // Root node — always unlocked (unless user manually locked)
      const newState = node.state === "locked" ? "unlocked" : node.state;
      updated[id] = { ...node, state: newState };
      return;
    }

    const allComplete = preds.every((pid) => nodes[pid]?.state === "complete");
    const anyComplete = preds.some((pid) => nodes[pid]?.state === "complete");

    let newState = node.state;
    if (!allComplete) {
      // Should be locked — but preserve in-progress/complete if user set it
      if (node.state !== "complete" && node.state !== "in-progress") {
        newState = "locked";
      }
    } else {
      // All prereqs done — should be at least unlocked
      if (node.state === "locked") {
        newState = "unlocked";
      }
    }

    updated[id] = { ...node, state: newState };
  });

  return updated;
}

/**
 * Compute traversal stats
 */
export function computeStats(nodes, edges) {
  const total = Object.keys(nodes).length;
  const complete = Object.values(nodes).filter(
    (n) => n.state === "complete",
  ).length;
  const inProgress = Object.values(nodes).filter(
    (n) => n.state === "in-progress",
  ).length;
  const unlocked = Object.values(nodes).filter(
    (n) => n.state === "unlocked",
  ).length;

  const completionPct = total > 0 ? Math.round((complete / total) * 100) : 0;

  // Weighted progress: complete=1, in-progress=progress/100
  const weightedProgress = Object.values(nodes).reduce((acc, n) => {
    if (n.state === "complete") return acc + 1;
    if (n.state === "in-progress") return acc + (n.progress || 0) / 100;
    return acc;
  }, 0);
  const traversalDepth =
    total > 0 ? Math.round((weightedProgress / total) * 100) : 0;

  return {
    total,
    complete,
    inProgress,
    unlocked,
    completionPct,
    traversalDepth,
  };
}

/**
 * Suggest next node: unlocked nodes, prioritised by:
 *  1. fewest remaining prerequisites (already satisfied since unlocked)
 *  2. most completed successors in the future (high unlock leverage)
 */
export function suggestNextNode(nodes, edges) {
  const adj = buildAdjacency(nodes, edges);
  const candidates = Object.values(nodes).filter((n) => n.state === "unlocked");
  if (!candidates.length) return null;

  const scored = candidates.map((node) => {
    // Count how many nodes this unlocks (downstream)
    const downstream = countReachable(adj, node.id, nodes);
    return { node, score: downstream };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.node || null;
}

function countReachable(adj, startId, nodes) {
  const visited = new Set();
  const queue = [startId];
  while (queue.length) {
    const curr = queue.shift();
    if (visited.has(curr)) continue;
    visited.add(curr);
    (adj[curr] || []).forEach((n) => {
      if (!visited.has(n) && nodes[n]) queue.push(n);
    });
  }
  return visited.size - 1; // exclude start
}

/**
 * Get all ancestors of a node
 */
export function getAncestors(nodeId, nodes, edges) {
  const radj = buildReverseAdj(nodes, edges);
  const visited = new Set();
  const queue = [nodeId];
  while (queue.length) {
    const curr = queue.shift();
    if (visited.has(curr)) continue;
    visited.add(curr);
    (radj[curr] || []).forEach((n) => {
      if (!visited.has(n)) queue.push(n);
    });
  }
  visited.delete(nodeId);
  return visited;
}

/**
 * Get all descendants of a node
 */
export function getDescendants(nodeId, nodes, edges) {
  const adj = buildAdjacency(nodes, edges);
  const visited = new Set();
  const queue = [nodeId];
  while (queue.length) {
    const curr = queue.shift();
    if (visited.has(curr)) continue;
    visited.add(curr);
    (adj[curr] || []).forEach((n) => {
      if (!visited.has(n)) queue.push(n);
    });
  }
  visited.delete(nodeId);
  return visited;
}
