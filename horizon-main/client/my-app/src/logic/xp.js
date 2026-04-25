// utils/xp.js — Gamification layer

export const XP_REWARDS = {
  completeNode: 100,
  startNode: 15,
  addNode: 10,
  addEdge: 5,
  addResource: 8,
  addNotes: 12,
  dailyStreak: 25,
};

export const LEVELS = [
  { level: 1, title: "Apprentice", xpMin: 0, xpMax: 100, color: "#5a5a7a" },
  { level: 2, title: "Practitioner", xpMin: 100, xpMax: 300, color: "#5ab4ff" },
  { level: 3, title: "Analyst", xpMin: 300, xpMax: 600, color: "#ffaa44" },
  { level: 4, title: "Engineer", xpMin: 600, xpMax: 1000, color: "#44ffaa" },
  { level: 5, title: "Architect", xpMin: 1000, xpMax: 1500, color: "#ff6b35" },
  { level: 6, title: "Expert", xpMin: 1500, xpMax: 2200, color: "#c084fc" },
  { level: 7, title: "Visionary", xpMin: 2200, xpMax: 3000, color: "#f472b6" },
  {
    level: 8,
    title: "Grandmaster",
    xpMin: 3000,
    xpMax: Infinity,
    color: "#fbbf24",
  },
];

export function getLevelInfo(xp) {
  const lvl =
    LEVELS.find((l) => xp >= l.xpMin && xp < l.xpMax) ||
    LEVELS[LEVELS.length - 1];
  const next = LEVELS[lvl.level] || lvl;
  const progress =
    lvl.xpMax === Infinity
      ? 100
      : Math.round(((xp - lvl.xpMin) / (lvl.xpMax - lvl.xpMin)) * 100);
  return {
    ...lvl,
    next,
    progressToNext: progress,
    xpToNext: Math.max(0, next.xpMin - xp),
  };
}

export const BADGES = [
  {
    id: "first_node",
    label: "Node Zero",
    desc: "Created your first skill node",
    icon: "🌱",
    check: (s) => Object.keys(s.nodes).length >= 1,
  },
  {
    id: "connected",
    label: "Connected",
    desc: "Drew your first dependency edge",
    icon: "🔗",
    check: (s) => s.edges.length >= 1,
  },
  {
    id: "first_done",
    label: "First Blood",
    desc: "Completed your first skill",
    icon: "⚡",
    check: (s) => Object.values(s.nodes).some((n) => n.state === "complete"),
  },
  {
    id: "five_complete",
    label: "On a Roll",
    desc: "Completed 5 skills",
    icon: "🔥",
    check: (s) =>
      Object.values(s.nodes).filter((n) => n.state === "complete").length >= 5,
  },
  {
    id: "deep_graph",
    label: "Graph Architect",
    desc: "Built a graph with 10+ nodes",
    icon: "🏗️",
    check: (s) => Object.keys(s.nodes).length >= 10,
  },
  {
    id: "resourceful",
    label: "Resourceful",
    desc: "Added 5+ external resource links",
    icon: "📚",
    check: (s) =>
      Object.values(s.nodes).reduce(
        (a, n) => a + (n.resources?.length || 0),
        0,
      ) >= 5,
  },
  {
    id: "half_done",
    label: "Halfway There",
    desc: "Reached 50% graph completion",
    icon: "🎯",
    check: (s) => {
      const ns = Object.values(s.nodes);
      return (
        ns.length > 0 &&
        ns.filter((n) => n.state === "complete").length / ns.length >= 0.5
      );
    },
  },
  {
    id: "full_done",
    label: "Curriculum Master",
    desc: "Completed the entire skill graph",
    icon: "🏆",
    check: (s) => {
      const ns = Object.values(s.nodes);
      return ns.length > 0 && ns.every((n) => n.state === "complete");
    },
  },
];

export function checkNewBadges(state, earnedBadges = []) {
  return BADGES.filter((b) => !earnedBadges.includes(b.id) && b.check(state));
}
