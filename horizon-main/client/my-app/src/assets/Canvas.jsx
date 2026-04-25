// components/Canvas.jsx — SVG DAG editor
import React, { useRef, useState, useCallback, useEffect } from "react";
import SkillNode from "./SkillNode.jsx";
import EdgePath from "./EdgePath.jsx";
import LassoSelect from "./LassoSelect.jsx";
import "./Canvas.css";

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2.5;

export default function Canvas({
  nodes,
  edges,
  clusters,
  viewport,
  selectedNode,
  settings,
  cycleError,
  dispatch,
}) {
  const svgRef = useRef(null);
  const [draggingNode, setDraggingNode] = useState(null); // { id, startX, startY, mouseX, mouseY }
  const [drawingEdge, setDrawingEdge] = useState(null); // { fromId, x1, y1, x2, y2 }
  const [hoveredNode, setHoveredNode] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const [lasso, setLasso] = useState(null); // { x, y, w, h, startX, startY }
  const [pendingEdgeLabel, setPendingEdgeLabel] = useState(null);

  const { x: vx, y: vy, zoom: vz } = viewport;

  // ── Coordinate helpers ────────────────────────────────────────────────────
  const svgToWorld = useCallback(
    (sx, sy) => ({
      x: (sx - vx) / vz,
      y: (sy - vy) / vz,
    }),
    [vx, vy, vz],
  );

  const getEventPos = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  // ── Zoom ─────────────────────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const pos = getEventPos(e);
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, vz * factor));
      // Zoom toward cursor
      const newVx = pos.x - (pos.x - vx) * (newZoom / vz);
      const newVy = pos.y - (pos.y - vy) * (newZoom / vz);
      dispatch({
        type: "SET_VIEWPORT",
        viewport: { x: newVx, y: newVy, zoom: newZoom },
      });
    },
    [vx, vy, vz, dispatch, getEventPos],
  );

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // ── Double-click: create node ─────────────────────────────────────────────
  const handleCanvasDblClick = useCallback(
    (e) => {
      e.preventDefault();

      const pos = getEventPos(e);
      const world = svgToWorld(pos.x, pos.y);

      dispatch({
        type: "ADD_NODE",
        x: world.x - 60,
        y: world.y - 30,
      });
    },
    [dispatch, getEventPos, svgToWorld],
  );

  // ── Mouse down ────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e) => {
      const pos = getEventPos(e);

      // Middle mouse or space+left: pan
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: pos.x - vx, y: pos.y - vy });
        return;
      }

      // Lasso on empty canvas
      if (e.button === 0 && e.target === svgRef.current) {
        const world = svgToWorld(pos.x, pos.y);
        setLasso({
          startX: world.x,
          startY: world.y,
          x: world.x,
          y: world.y,
          w: 0,
          h: 0,
        });
      }
    },
    [vx, vy, getEventPos, svgToWorld],
  );

  // ── Mouse move ────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e) => {
      const pos = getEventPos(e);

      if (isPanning) {
        dispatch({
          type: "SET_VIEWPORT",
          viewport: { x: pos.x - panStart.x, y: pos.y - panStart.y, zoom: vz },
        });
        return;
      }

      if (draggingNode) {
        const world = svgToWorld(pos.x, pos.y);
        dispatch({
          type: "MOVE_NODE",
          id: draggingNode.id,
          x: world.x - draggingNode.offX,
          y: world.y - draggingNode.offY,
        });
        return;
      }

      if (drawingEdge) {
        const world = svgToWorld(pos.x, pos.y);
        setDrawingEdge((prev) => ({ ...prev, x2: world.x, y2: world.y }));
        return;
      }

      if (lasso) {
        const world = svgToWorld(pos.x, pos.y);
        const x = Math.min(world.x, lasso.startX);
        const y = Math.min(world.y, lasso.startY);
        const w = Math.abs(world.x - lasso.startX);
        const h = Math.abs(world.y - lasso.startY);
        setLasso((prev) => ({ ...prev, x, y, w, h }));
      }
    },
    [
      isPanning,
      draggingNode,
      drawingEdge,
      lasso,
      panStart,
      vz,
      dispatch,
      getEventPos,
      svgToWorld,
    ],
  );

  // ── Mouse up ──────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback(
    (e) => {
      if (isPanning) {
        setIsPanning(false);
        setPanStart(null);
        return;
      }

      if (drawingEdge) {
        // Check if we released on a node
        if (hoveredNode && hoveredNode !== drawingEdge.fromId) {
          dispatch({
            type: "ADD_EDGE",
            from: drawingEdge.fromId,
            to: hoveredNode,
          });
        }
        setDrawingEdge(null);
        return;
      }

      if (draggingNode) {
        setDraggingNode(null);
        return;
      }

      if (lasso) {
        // Select nodes within lasso
        if (lasso.w > 10 && lasso.h > 10) {
          const selected = Object.values(nodes)
            .filter(
              (n) =>
                n.x >= lasso.x &&
                n.x <= lasso.x + lasso.w &&
                n.y >= lasso.y &&
                n.y <= lasso.y + lasso.h,
            )
            .map((n) => n.id);
          if (selected.length > 0) {
            const clusterName = prompt(
              `Name this cluster (${selected.length} nodes):`,
            );
            if (clusterName) {
              const clusterId = "cluster-" + Date.now();
              dispatch({
                type: "ADD_CLUSTER",
                id: clusterId,
                label: clusterName,
                color: randomColor(),
              });
              dispatch({
                type: "ASSIGN_CLUSTER",
                nodeIds: selected,
                clusterId,
              });
            }
          }
        }
        setLasso(null);
      }
    },
    [isPanning, drawingEdge, draggingNode, lasso, hoveredNode, nodes, dispatch],
  );

  // ── Node event handlers ───────────────────────────────────────────────────
  const handleNodeMouseDown = useCallback(
    (e, nodeId) => {
      e.stopPropagation();
      if (e.button !== 0) return;

      const pos = getEventPos(e);
      const world = svgToWorld(pos.x, pos.y);
      const node = nodes[nodeId];

      // Check if clicking near edge of node (for drawing edges)
      // Detect via shift key or if we're in a 16px border zone
      if (e.shiftKey) {
        setDrawingEdge({
          fromId: nodeId,
          x1: node.x + 60,
          y1: node.y + 30,
          x2: world.x,
          y2: world.y,
        });
        return;
      }

      setDraggingNode({
        id: nodeId,
        offX: world.x - node.x,
        offY: world.y - node.y,
      });
      dispatch({ type: "SELECT_NODE", id: nodeId });
    },
    [nodes, getEventPos, svgToWorld, dispatch],
  );

  const handleNodeMouseEnter = useCallback((nodeId) => {
    setHoveredNode(nodeId);
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  const handleEdgePortDrag = useCallback(
    (e, nodeId) => {
      e.stopPropagation();
      const pos = getEventPos(e);
      const world = svgToWorld(pos.x, pos.y);
      const node = nodes[nodeId];
      setDrawingEdge({
        fromId: nodeId,
        x1: node.x + 60,
        y1: node.y + 30,
        x2: world.x,
        y2: world.y,
      });
    },
    [nodes, getEventPos, svgToWorld],
  );

  // ── Delete key ────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !e.target.closest("input, textarea, [contenteditable]")
      ) {
        if (selectedNode) {
          dispatch({ type: "DELETE_NODE", id: selectedNode });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedNode, dispatch]);

  // ── Grid dots ─────────────────────────────────────────────────────────────
  const gridSize = settings.gridSize;

  // World bounds for visible area
  const svgW = svgRef.current?.clientWidth || 1200;
  const svgH = svgRef.current?.clientHeight || 800;

  const worldLeft = -vx / vz;
  const worldTop = -vy / vz;
  const worldRight = worldLeft + svgW / vz;
  const worldBot = worldTop + svgH / vz;

  // Build cluster backgrounds
  const clusterGroups = {};
  Object.values(nodes).forEach((n) => {
    if (n.cluster && clusters[n.cluster]) {
      if (!clusterGroups[n.cluster]) clusterGroups[n.cluster] = [];
      clusterGroups[n.cluster].push(n);
    }
  });

  return (
    <svg
      ref={svgRef}
      className="dag-canvas-svg"
      style={{
        cursor: isPanning
          ? "grabbing"
          : draggingNode
            ? "grabbing"
            : lasso
              ? "crosshair"
              : "default",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleCanvasDblClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      <defs>
        {/* Arrow markers per state */}
        {[
          "locked",
          "unlocked",
          "in-progress",
          "complete",
          "drawing",
          "requires",
          "supports",
        ].map((type) => (
          <marker
            key={type}
            id={`arrow-${type}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path
              d="M 0 0 L 10 5 L 0 10 z"
              fill={
                type === "complete"
                  ? "var(--complete-fg)"
                  : type === "in-progress"
                    ? "var(--in-progress-fg)"
                    : type === "unlocked"
                      ? "var(--unlocked-fg)"
                      : type === "drawing"
                        ? "var(--accent)"
                        : type === "supports"
                          ? "var(--xp-color)"
                          : "var(--locked-fg)"
              }
            />
          </marker>
        ))}
        {/* Glow filter */}
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Grid pattern */}
        <pattern
          id="grid-dots"
          x={vx % (gridSize * vz)}
          y={vy % (gridSize * vz)}
          width={gridSize * vz}
          height={gridSize * vz}
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx={(gridSize * vz) / 2}
            cy={(gridSize * vz) / 2}
            r="0.8"
            fill="rgba(255,255,255,0.06)"
          />
        </pattern>
      </defs>

      {/* Background */}
      <rect
        className="canvas-bg"
        width="100%"
        height="100%"
        fill="var(--bg-void)"
      />
      {settings.snapGrid && (
        <rect width="100%" height="100%" fill="url(#grid-dots)" />
      )}

      {/* World group */}
      <g transform={`translate(${vx},${vy}) scale(${vz})`}>
        {/* Cluster backgrounds */}
        {Object.entries(clusterGroups).map(([cid, cnodes]) => {
          const pad = 40;
          const xs = cnodes.map((n) => n.x);
          const ys = cnodes.map((n) => n.y);
          const cx = Math.min(...xs) - pad;
          const cy = Math.min(...ys) - pad;
          const cw = Math.max(...xs) - Math.min(...xs) + 120 + pad * 2;
          const ch = Math.max(...ys) - Math.min(...ys) + 60 + pad * 2;
          const cl = clusters[cid];
          return (
            <g key={cid}>
              <rect
                x={cx}
                y={cy}
                width={cw}
                height={ch}
                rx="16"
                fill={cl.color + "10"}
                stroke={cl.color + "30"}
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              <text
                x={cx + 12}
                y={cy + 20}
                fill={cl.color}
                fontSize="10"
                fontFamily="var(--font-display)"
                fontWeight="600"
                letterSpacing="0.1em"
                textTransform="uppercase"
                opacity="0.7"
              >
                {cl.label.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Edges */}
        {edges.map((edge) => (
          <EdgePath
            key={edge.id}
            edge={edge}
            fromNode={nodes[edge.from]}
            toNode={nodes[edge.to]}
            isHighlighted={
              selectedNode === edge.from || selectedNode === edge.to
            }
            onDelete={() => dispatch({ type: "DELETE_EDGE", id: edge.id })}
          />
        ))}

        {/* Drawing edge preview */}
        {drawingEdge && (
          <DrawingEdge
            x1={drawingEdge.x1}
            y1={drawingEdge.y1}
            x2={drawingEdge.x2}
            y2={drawingEdge.y2}
            hoveredNode={hoveredNode}
            fromId={drawingEdge.fromId}
          />
        )}

        {/* Nodes */}
        {Object.values(nodes).map((node) => (
          <SkillNode
            key={node.id}
            node={node}
            isSelected={selectedNode === node.id}
            isHovered={hoveredNode === node.id}
            isDragging={draggingNode?.id === node.id}
            isDrawingFrom={drawingEdge?.fromId === node.id}
            isDrawingTarget={
              drawingEdge &&
              hoveredNode === node.id &&
              hoveredNode !== drawingEdge.fromId
            }
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onMouseEnter={() => handleNodeMouseEnter(node.id)}
            onMouseLeave={handleNodeMouseLeave}
            onEdgePortDrag={(e) => handleEdgePortDrag(e, node.id)}
            dispatch={dispatch}
          />
        ))}

        {/* Lasso */}
        {lasso && lasso.w > 4 && (
          <rect
            x={lasso.x}
            y={lasso.y}
            width={lasso.w}
            height={lasso.h}
            fill="rgba(90,180,255,0.05)"
            stroke="var(--unlocked-fg)"
            strokeWidth={1 / vz}
            strokeDasharray={`${4 / vz} ${4 / vz}`}
            pointerEvents="none"
          />
        )}
      </g>

      {/* Double-click hint */}
      {Object.keys(nodes).length === 0 && (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          fill="rgba(255,255,255,0.12)"
          fontSize="18"
          fontFamily="var(--font-display)"
        >
          Double-click anywhere to create a skill node
        </text>
      )}
    </svg>
  );
}

function DrawingEdge({ x1, y1, x2, y2, hoveredNode, fromId }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx1 = x1 + dx * 0.5;
  const cy1 = y1;
  const cx2 = x1 + dx * 0.5;
  const cy2 = y2;

  const isValid = hoveredNode && hoveredNode !== fromId;

  return (
    <g>
      <path
        d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
        fill="none"
        stroke={isValid ? "var(--complete-fg)" : "var(--accent)"}
        strokeWidth="2"
        strokeDasharray="6 4"
        markerEnd={`url(#arrow-drawing)`}
        opacity="0.8"
        pointerEvents="none"
        style={{ animation: "dash-flow 0.3s linear infinite" }}
      />
    </g>
  );
}

function randomColor() {
  const colors = [
    "#5ab4ff",
    "#ffaa44",
    "#44ffaa",
    "#ff6b35",
    "#c084fc",
    "#f472b6",
    "#fbbf24",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
