export const TEMPLATES = {
  // ─────────────────────────────────────────────
  // 🌐 FULL-STACK WEB DEV (DEEP DAG)
  // ─────────────────────────────────────────────
  webdev: () => ({
    nodes: {
      html: { id: "html", title: "HTML", x: 100, y: 200, state: "unlocked" },
      css: { id: "css", title: "CSS", x: 300, y: 100, state: "locked" },
      js: { id: "js", title: "JavaScript", x: 300, y: 300, state: "locked" },

      dom: {
        id: "dom",
        title: "DOM Manipulation",
        x: 500,
        y: 300,
        state: "locked",
      },
      async: {
        id: "async",
        title: "Async JS",
        x: 700,
        y: 300,
        state: "locked",
      },

      react: { id: "react", title: "React", x: 900, y: 200, state: "locked" },
      state: {
        id: "state",
        title: "State Management",
        x: 1100,
        y: 200,
        state: "locked",
      },

      node: { id: "node", title: "Node.js", x: 900, y: 400, state: "locked" },
      express: {
        id: "express",
        title: "Express",
        x: 1100,
        y: 400,
        state: "locked",
      },

      db: { id: "db", title: "Databases", x: 1300, y: 350, state: "locked" },
      auth: {
        id: "auth",
        title: "Auth Systems",
        x: 1500,
        y: 250,
        state: "locked",
      },

      deploy: {
        id: "deploy",
        title: "Deployment",
        x: 1700,
        y: 200,
        state: "locked",
      },
    },

    edges: [
      { id: "e1", from: "html", to: "css" },
      { id: "e2", from: "html", to: "js" },
      { id: "e3", from: "js", to: "dom" },
      { id: "e4", from: "js", to: "async" },
      { id: "e5", from: "dom", to: "react" },
      { id: "e6", from: "async", to: "react" },
      { id: "e7", from: "react", to: "state" },

      { id: "e8", from: "js", to: "node" },
      { id: "e9", from: "node", to: "express" },

      { id: "e10", from: "express", to: "db" },
      { id: "e11", from: "state", to: "auth" },
      { id: "e12", from: "db", to: "auth" },

      { id: "e13", from: "auth", to: "deploy" },
    ],

    clusters: {
      fundamentals: {
        id: "fundamentals",
        label: "Fundamentals",
        color: "#5ab4ff",
      },
      frontend: { id: "frontend", label: "Frontend", color: "#ffaa44" },
      backend: { id: "backend", label: "Backend", color: "#44ffaa" },
      production: { id: "production", label: "Production", color: "#ff6b35" },
    },
  }),

  // ─────────────────────────────────────────────
  // 🤖 DATA SCIENCE / ML (REALISTIC FLOW)
  // ─────────────────────────────────────────────
  datascience: () => ({
    nodes: {
      python: {
        id: "python",
        title: "Python",
        x: 100,
        y: 300,
        state: "unlocked",
      },

      numpy: { id: "numpy", title: "NumPy", x: 300, y: 200, state: "locked" },
      pandas: {
        id: "pandas",
        title: "Pandas",
        x: 300,
        y: 400,
        state: "locked",
      },

      viz: {
        id: "viz",
        title: "Data Visualization",
        x: 500,
        y: 200,
        state: "locked",
      },
      stats: {
        id: "stats",
        title: "Statistics",
        x: 500,
        y: 400,
        state: "locked",
      },

      ml: {
        id: "ml",
        title: "Machine Learning",
        x: 700,
        y: 300,
        state: "locked",
      },
      feature: {
        id: "feature",
        title: "Feature Engineering",
        x: 900,
        y: 200,
        state: "locked",
      },

      dl: {
        id: "dl",
        title: "Deep Learning",
        x: 1100,
        y: 300,
        state: "locked",
      },
      nlp: { id: "nlp", title: "NLP", x: 1300, y: 200, state: "locked" },
      cv: {
        id: "cv",
        title: "Computer Vision",
        x: 1300,
        y: 400,
        state: "locked",
      },

      deploy: {
        id: "deploy",
        title: "ML Deployment",
        x: 1500,
        y: 300,
        state: "locked",
      },
    },

    edges: [
      { id: "e1", from: "python", to: "numpy" },
      { id: "e2", from: "python", to: "pandas" },

      { id: "e3", from: "numpy", to: "viz" },
      { id: "e4", from: "pandas", to: "viz" },

      { id: "e5", from: "pandas", to: "stats" },

      { id: "e6", from: "viz", to: "ml" },
      { id: "e7", from: "stats", to: "ml" },

      { id: "e8", from: "ml", to: "feature" },
      { id: "e9", from: "feature", to: "dl" },

      { id: "e10", from: "dl", to: "nlp" },
      { id: "e11", from: "dl", to: "cv" },

      { id: "e12", from: "nlp", to: "deploy" },
      { id: "e13", from: "cv", to: "deploy" },
    ],

    clusters: {
      fundamentals: {
        id: "fundamentals",
        label: "Foundations",
        color: "#5ab4ff",
      },
      analysis: { id: "analysis", label: "Analysis", color: "#ffaa44" },
      ml: { id: "ml", label: "ML Core", color: "#44ffaa" },
      advanced: { id: "advanced", label: "Advanced AI", color: "#ff6b35" },
    },
  }),

  // ─────────────────────────────────────────────
  // 🔐 CYBERSECURITY (PROPER DAG)
  // ─────────────────────────────────────────────
  cybersecurity: () => ({
    nodes: {
      networking: {
        id: "networking",
        title: "Networking",
        x: 100,
        y: 300,
        state: "unlocked",
      },
      linux: { id: "linux", title: "Linux", x: 300, y: 200, state: "locked" },
      web: { id: "web", title: "Web Basics", x: 300, y: 400, state: "locked" },

      scripting: {
        id: "scripting",
        title: "Scripting",
        x: 500,
        y: 200,
        state: "locked",
      },
      recon: { id: "recon", title: "Recon", x: 500, y: 400, state: "locked" },

      vuln: {
        id: "vuln",
        title: "Vulnerability Analysis",
        x: 700,
        y: 300,
        state: "locked",
      },
      websec: {
        id: "websec",
        title: "Web Exploitation",
        x: 900,
        y: 200,
        state: "locked",
      },
      privesc: {
        id: "privesc",
        title: "Privilege Escalation",
        x: 900,
        y: 400,
        state: "locked",
      },

      exploit: {
        id: "exploit",
        title: "Exploit Dev",
        x: 1100,
        y: 300,
        state: "locked",
      },
      redteam: {
        id: "redteam",
        title: "Red Team Ops",
        x: 1300,
        y: 200,
        state: "locked",
      },
      blueteam: {
        id: "blueteam",
        title: "Blue Team",
        x: 1300,
        y: 400,
        state: "locked",
      },
    },

    edges: [
      { id: "e1", from: "networking", to: "linux" },
      { id: "e2", from: "networking", to: "web" },

      { id: "e3", from: "linux", to: "scripting" },
      { id: "e4", from: "web", to: "recon" },

      { id: "e5", from: "scripting", to: "vuln" },
      { id: "e6", from: "recon", to: "vuln" },

      { id: "e7", from: "vuln", to: "websec" },
      { id: "e8", from: "vuln", to: "privesc" },

      { id: "e9", from: "websec", to: "exploit" },
      { id: "e10", from: "privesc", to: "exploit" },

      { id: "e11", from: "exploit", to: "redteam" },
      { id: "e12", from: "exploit", to: "blueteam" },
    ],

    clusters: {
      basics: { id: "basics", label: "Basics", color: "#5ab4ff" },
      recon: { id: "recon", label: "Recon", color: "#ffaa44" },
      exploitation: {
        id: "exploitation",
        label: "Exploitation",
        color: "#44ffaa",
      },
      ops: { id: "ops", label: "Security Ops", color: "#ff6b35" },
    },
  }),
};
