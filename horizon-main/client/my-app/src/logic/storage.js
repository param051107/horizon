// utils/storage.js — Atomic localStorage persistence

const STORAGE_KEY = "skilldag_v2";

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("SkillDAG: localStorage save failed", e);
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

// Default starter graph for ML aspirant scenario
export function getDefaultState() {
  const now = Date.now();
  return {
    nodes: {
      "node-python": {
        id: "node-python",
        title: "Python Basics",
        state: "complete",
        x: 320,
        y: 300,
        notes:
          "Variables, loops, functions, OOP fundamentals. The bedrock of everything.",
        timeEstimate: "40h",
        resources: [
          {
            id: "r1",
            label: "Official Python Docs",
            url: "https://docs.python.org/3/",
          },
          {
            id: "r2",
            label: "Automate the Boring Stuff",
            url: "https://automatetheboringstuff.com/",
          },
        ],
        cluster: "foundations",
        progress: 100,
        xp: 150,
        createdAt: now - 86400000 * 7,
        completedAt: now - 86400000 * 3,
      },
      "node-numpy": {
        id: "node-numpy",
        title: "NumPy",
        state: "complete",
        x: 620,
        y: 180,
        notes:
          "N-dimensional arrays, broadcasting, vectorised ops. The backbone of scientific Python.",
        timeEstimate: "20h",
        resources: [
          {
            id: "r1",
            label: "NumPy Quickstart",
            url: "https://numpy.org/doc/stable/user/quickstart.html",
          },
        ],
        cluster: "data-tools",
        progress: 100,
        xp: 100,
        createdAt: now - 86400000 * 5,
        completedAt: now - 86400000 * 2,
      },
      "node-pandas": {
        id: "node-pandas",
        title: "Pandas",
        state: "in-progress",
        x: 620,
        y: 420,
        notes:
          "DataFrames, groupby, merge — wrangling real-world tabular data efficiently.",
        timeEstimate: "25h",
        resources: [
          {
            id: "r1",
            label: "Pandas Docs",
            url: "https://pandas.pydata.org/docs/",
          },
          {
            id: "r2",
            label: "10 mins to pandas",
            url: "https://pandas.pydata.org/docs/user_guide/10min.html",
          },
        ],
        cluster: "data-tools",
        progress: 60,
        xp: 0,
        createdAt: now - 86400000 * 3,
        completedAt: null,
      },
      "node-matplotlib": {
        id: "node-matplotlib",
        title: "Matplotlib & Seaborn",
        state: "unlocked",
        x: 920,
        y: 180,
        notes: "Visualisation layer — plots, heatmaps, distribution charts.",
        timeEstimate: "15h",
        resources: [
          {
            id: "r1",
            label: "Matplotlib Gallery",
            url: "https://matplotlib.org/stable/gallery/",
          },
        ],
        cluster: "data-tools",
        progress: 0,
        xp: 0,
        createdAt: now - 86400000 * 1,
        completedAt: null,
      },
      "node-sklearn": {
        id: "node-sklearn",
        title: "Scikit-Learn",
        state: "locked",
        x: 920,
        y: 420,
        notes:
          "Classical ML — regression, classification, clustering, pipelines.",
        timeEstimate: "50h",
        resources: [
          {
            id: "r1",
            label: "scikit-learn User Guide",
            url: "https://scikit-learn.org/stable/user_guide.html",
          },
        ],
        cluster: "ml-core",
        progress: 0,
        xp: 0,
        createdAt: now,
        completedAt: null,
      },
      "node-stats": {
        id: "node-stats",
        title: "Statistics & Probability",
        state: "unlocked",
        x: 320,
        y: 540,
        notes:
          "Descriptive stats, distributions, hypothesis testing, Bayes basics.",
        timeEstimate: "30h",
        resources: [
          {
            id: "r1",
            label: "Khan Academy Statistics",
            url: "https://www.khanacademy.org/math/statistics-probability",
          },
        ],
        cluster: "foundations",
        progress: 0,
        xp: 0,
        createdAt: now,
        completedAt: null,
      },
      "node-deep": {
        id: "node-deep",
        title: "Deep Learning (PyTorch)",
        state: "locked",
        x: 1220,
        y: 300,
        notes: "Neural nets, backprop, CNNs, RNNs. The frontier.",
        timeEstimate: "80h",
        resources: [
          { id: "r1", label: "Fast.ai Course", url: "https://course.fast.ai/" },
        ],
        cluster: "ml-core",
        progress: 0,
        xp: 0,
        createdAt: now,
        completedAt: null,
      },
    },
    edges: [
      { id: "e1", from: "node-python", to: "node-numpy", label: "requires" },
      { id: "e2", from: "node-python", to: "node-pandas", label: "requires" },
      {
        id: "e3",
        from: "node-numpy",
        to: "node-matplotlib",
        label: "requires",
      },
      { id: "e4", from: "node-numpy", to: "node-sklearn", label: "requires" },
      { id: "e5", from: "node-pandas", to: "node-sklearn", label: "requires" },
      { id: "e6", from: "node-stats", to: "node-sklearn", label: "supports" },
      { id: "e7", from: "node-sklearn", to: "node-deep", label: "requires" },
      { id: "e8", from: "node-matplotlib", to: "node-deep", label: "supports" },
    ],
    clusters: {
      foundations: {
        id: "foundations",
        label: "Foundations",
        color: "#5ab4ff",
      },
      "data-tools": { id: "data-tools", label: "Data Tools", color: "#ffaa44" },
      "ml-core": { id: "ml-core", label: "ML Core", color: "#44ffaa" },
    },
    viewport: { x: 0, y: 0, zoom: 1 },
    xpTotal: 250,
    xpLevel: 2,
    selectedNode: null,
    settings: {
      snapGrid: true,
      gridSize: 40,
      showMinimap: true,
      animationsEnabled: true,
    },
  };
}

export function createCluster(label) {
  return {
    id: "cluster-" + Date.now(),
    label,
    color: randomColor(),
  };
}