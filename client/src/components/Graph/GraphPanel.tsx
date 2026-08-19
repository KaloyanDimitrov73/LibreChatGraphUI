import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Link2, X, Check } from 'lucide-react';
import { emitGraphEvent } from '~/hooks/Graph/useGraphEvents';
import './GraphPanel.css';

type Node = {
  id: string;
  label: string;
  type?: string;
  x?: number;
  y?: number;
};

type Edge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

type SimNode = Node & { x: number; y: number; vx: number; vy: number };

export type GraphContext = { conversationId?: string; messageId?: string };

export type GraphPanelProps = {
  /** Whether the panel is currently expanded. Owned by GraphPanelContainer. */
  open: boolean;
  /** Which conversation/message the panel is currently scoped to. */
  context: GraphContext;
  /** Toggle open/closed — call with the next desired state. */
  onToggle: (open: boolean) => void;
  onNodeClick?: (node: Node) => void;
};

const WIDTH = 640;
const HEIGHT = 420;
const NODE_RADIUS = 22;
const SELECTED_RADIUS = 26;

export default function GraphPanel({ open, context, onToggle, onNodeClick }: GraphPanelProps) {
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const edgesRef = useRef<Edge[]>([]);
  edgesRef.current = edges;

  const selected = nodes.find((n) => n.id === selectedId) || null;

  // ---- Loading -----------------------------------------------------------

  const loadForContext = useCallback(async (ctx: GraphContext) => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (ctx.conversationId) params.set('conversationId', ctx.conversationId);
      if (ctx.messageId) params.set('messageId', ctx.messageId);
      const url = params.toString()
        ? `/api/graph/node/root?${params.toString()}`
        : '/api/graph/node/root';
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed to load graph root');
      const data = await resp.json();
      const loadedNodes: Node[] = data.nodes || [];
      setNodes((prev) =>
        loadedNodes.map((n, i) => {
          const existing = prev.find((p) => p.id === n.id);
          return {
            ...n,
            x: existing?.x ?? n.x ?? WIDTH / 2 + Math.cos(i) * 120,
            y: existing?.y ?? n.y ?? HEIGHT / 2 + Math.sin(i) * 120,
            vx: 0,
            vy: 0,
          };
        }),
      );
      setEdges(data.edges || []);
      emitGraphEvent('graph:data-loaded', { data });
    } catch (err) {
      console.error('GraphPanel loadForContext', err);
      setError('Could not load the graph.');
    }
  }, []);

  // Reset selection and reload whenever the panel opens, or the message/
  // conversation it's scoped to changes while already open.
  useEffect(() => {
    if (open) {
      setSelectedId(null);
      setConnectFrom(null);
      setEditingId(null);
      loadForContext(context);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, context.conversationId, context.messageId]);

  // ---- Force-directed layout ---------------------------------------------
  // Dependency-free: mutual repulsion between nodes, spring attraction along
  // edges, gentle pull to center. Skips whichever node is being dragged so
  // the pointer stays in control while the rest of the layout settles.

  useEffect(() => {
    if (!open || nodes.length === 0) return undefined;

    const tick = () => {
      setNodes((prev) => {
        const next = prev.map((n) => ({ ...n }));
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const a = next[i];
            const b = next[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distSq = Math.max(dx * dx + dy * dy, 1);
            const force = 2200 / distSq;
            const fx = (dx / Math.sqrt(distSq)) * force;
            const fy = (dy / Math.sqrt(distSq)) * force;
            a.vx += fx;
            a.vy += fy;
            b.vx -= fx;
            b.vy -= fy;
          }
        }
        for (const edge of edgesRef.current) {
          const a = next.find((n) => n.id === edge.source);
          const b = next.find((n) => n.id === edge.target);
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const spring = (dist - 150) * 0.02;
          const fx = (dx / dist) * spring;
          const fy = (dy / dist) * spring;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }
        for (const n of next) {
          if (draggingRef.current?.id === n.id) continue;
          n.vx += (WIDTH / 2 - n.x) * 0.002;
          n.vy += (HEIGHT / 2 - n.y) * 0.002;
          n.vx *= 0.82;
          n.vy *= 0.82;
          n.x += n.vx;
          n.y += n.vy;
          n.x = Math.max(NODE_RADIUS, Math.min(WIDTH - NODE_RADIUS, n.x));
          n.y = Math.max(NODE_RADIUS, Math.min(HEIGHT - NODE_RADIUS, n.y));
        }
        return next;
      });
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [open, nodes.length, edges.length]);

  // ---- Dragging ------------------------------------------------------------

  const handlePointerDown = (node: SimNode, event: React.PointerEvent) => {
    event.stopPropagation();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = WIDTH / rect.width;
    const scaleY = HEIGHT / rect.height;
    const px = (event.clientX - rect.left) * scaleX;
    const py = (event.clientY - rect.top) * scaleY;
    draggingRef.current = { id: node.id, offsetX: px - node.x, offsetY: py - node.y };
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    const drag = draggingRef.current;
    if (!drag) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = WIDTH / rect.width;
    const scaleY = HEIGHT / rect.height;
    const px = (event.clientX - rect.left) * scaleX - drag.offsetX;
    const py = (event.clientY - rect.top) * scaleY - drag.offsetY;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === drag.id
          ? {
              ...n,
              x: Math.max(NODE_RADIUS, Math.min(WIDTH - NODE_RADIUS, px)),
              y: Math.max(NODE_RADIUS, Math.min(HEIGHT - NODE_RADIUS, py)),
              vx: 0,
              vy: 0,
            }
          : n,
      ),
    );
  };

  const handlePointerUp = async () => {
    const drag = draggingRef.current;
    draggingRef.current = null;
    if (!drag) return;
    const node = nodes.find((n) => n.id === drag.id);
    if (!node) return;
    try {
      await fetch(`/api/graph/nodes/${encodeURIComponent(node.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: node.x, y: node.y }),
      });
    } catch (err) {
      // Non-fatal — position just won't persist across a reload.
      console.warn('persist node position failed', err);
    }
  };

  // ---- Node click / connect mode -------------------------------------------

  const handleNodeClick = (node: SimNode) => {
    if (connectFrom) {
      if (connectFrom !== node.id) {
        createEdge(connectFrom, node.id);
      }
      setConnectFrom(null);
      return;
    }
    setSelectedId(node.id);
    if (onNodeClick) onNodeClick(node);
    emitGraphEvent('graph:node-click', { node: node as any });
  };

  // ---- Mutations -----------------------------------------------------------

  const addNode = async () => {
    setError(null);
    const label = window.prompt('Label for the new node:');
    if (!label || !label.trim()) return;
    try {
      const resp = await fetch('/api/graph/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label.trim(),
          x: WIDTH / 2 + (Math.random() - 0.5) * 80,
          y: HEIGHT / 2 + (Math.random() - 0.5) * 80,
        }),
      });
      if (!resp.ok) throw new Error('Failed to create node');
      const node: Node = await resp.json();
      setNodes((prev) => [
        ...prev,
        { ...node, x: node.x ?? WIDTH / 2, y: node.y ?? HEIGHT / 2, vx: 0, vy: 0 },
      ]);
      // If a node is already selected, link the new one to it — a quick
      // way to build the graph up from the panel without switching modes.
      if (selectedId) {
        await createEdge(selectedId, node.id);
      } else {
        setSelectedId(node.id);
      }
    } catch (err) {
      console.error('addNode failed', err);
      setError('Could not create the node.');
    }
  };

  const startRename = (node: SimNode) => {
    setEditingId(node.id);
    setEditValue(node.label);
  };

  const commitRename = async () => {
    if (!editingId) return;
    const trimmed = editValue.trim();
    const id = editingId;
    setEditingId(null);
    if (!trimmed) return;
    try {
      const resp = await fetch(`/api/graph/nodes/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: trimmed }),
      });
      if (!resp.ok) throw new Error('Failed to rename node');
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, label: trimmed } : n)));
    } catch (err) {
      console.error('rename node failed', err);
      setError('Could not rename the node.');
    }
  };

  const deleteSelected = async () => {
    if (!selectedId) return;
    const id = selectedId;
    try {
      const resp = await fetch(`/api/graph/nodes/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('Failed to delete node');
      setNodes((prev) => prev.filter((n) => n.id !== id));
      setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
      setSelectedId(null);
    } catch (err) {
      console.error('delete node failed', err);
      setError('Could not delete the node.');
    }
  };

  const createEdge = async (source: string, target: string) => {
    try {
      const resp = await fetch('/api/graph/edges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, target }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create edge');
      }
      const edge: Edge = await resp.json();
      setEdges((prev) => [...prev, edge]);
    } catch (err) {
      console.error('createEdge failed', err);
      setError(err instanceof Error ? err.message : 'Could not connect those nodes.');
    }
  };

  const deleteEdge = async (edgeId: string) => {
    try {
      const resp = await fetch(`/api/graph/edges/${encodeURIComponent(edgeId)}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('Failed to delete edge');
      setEdges((prev) => prev.filter((e) => e.id !== edgeId));
    } catch (err) {
      console.error('delete edge failed', err);
      setError('Could not delete the connection.');
    }
  };

  // ---- Load Neighbors --------------------------------------------------

  const loadNeighbors = async (nodeId: string) => {
    try {
      const resp = await fetch(`/api/retrieval/node/${encodeURIComponent(nodeId)}/neighbors`, {
        method: 'POST',
      });
      if (!resp.ok) throw new Error('Failed to load neighbors');
      const data = await resp.json();
      setNodes((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const extras = (data.nodes || [])
          .filter((m: Node) => !ids.has(m.id))
          .map((m: Node, i: number) => ({
            ...m,
            x: m.x ?? WIDTH / 2 + Math.cos(i * 2) * 160,
            y: m.y ?? HEIGHT / 2 + Math.sin(i * 2) * 160,
            vx: 0,
            vy: 0,
          }));
        return prev.concat(extras);
      });
      setEdges((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const extras = (data.edges || []).filter((e: Edge) => !ids.has(e.id));
        return prev.concat(extras);
      });
    } catch (err) {
      console.warn('expand neighbors failed', err);
      setError('Could not load neighbors for this node.');
    }
  };

  // ---- Render ---------------------------------------------------------

  return (
    <div className="graph-panel">
      <div className="graph-header">
        <button aria-label="toggle-graph-panel" onClick={() => onToggle(!open)}>
          {open ? 'Hide Graph' : 'Show Graph'}
        </button>
      </div>

      {open && (
        <div className="graph-body">
          <div className="graph-toolbar">
            <button className="graph-toolbar-btn" onClick={addNode} title="Add a new node">
              <Plus size={14} /> Add Node
            </button>
            <button
              className={`graph-toolbar-btn${connectFrom ? ' active' : ''}`}
              onClick={() => setConnectFrom(connectFrom ? null : selectedId)}
              disabled={!selectedId && !connectFrom}
              title="Connect the selected node to another"
            >
              <Link2 size={14} /> {connectFrom ? 'Click a node…' : 'Connect'}
            </button>
            <button
              className="graph-toolbar-btn danger"
              onClick={deleteSelected}
              disabled={!selectedId}
              title="Delete selected node"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>

          {error && <div className="graph-error">{error}</div>}

          <div className="graph-canvas-wrap">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="graph-svg"
              role="img"
              aria-label="Graph view"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onClick={() => {
                if (!connectFrom) setSelectedId(null);
              }}
            >
              <defs>
                <marker
                  id="graph-arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" className="graph-arrow-head" />
                </marker>
              </defs>

              {edges.map((edge) => {
                const a = nodes.find((n) => n.id === edge.source);
                const b = nodes.find((n) => n.id === edge.target);
                if (!a || !b) return null;
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                // Stop the line at the edge of each circle (not its center)
                // so the arrowhead sits right against the target node.
                const x1 = a.x + (dx / dist) * NODE_RADIUS;
                const y1 = a.y + (dy / dist) * NODE_RADIUS;
                const x2 = b.x - (dx / dist) * (NODE_RADIUS + 4);
                const y2 = b.y - (dy / dist) * (NODE_RADIUS + 4);
                return (
                  <g key={edge.id} className="graph-edge-group">
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      className="graph-edge-line"
                      markerEnd="url(#graph-arrow)"
                    />
                    {edge.label && (
                      <text
                        x={(x1 + x2) / 2}
                        y={(y1 + y2) / 2 - 4}
                        textAnchor="middle"
                        className="graph-edge-label"
                      >
                        {edge.label}
                      </text>
                    )}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      className="graph-edge-hit"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEdge(edge.id);
                      }}
                    >
                      <title>Click to delete connection</title>
                    </line>
                  </g>
                );
              })}

              {nodes.map((node) => {
                const isSelected = node.id === selectedId;
                const isConnectSource = node.id === connectFrom;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="graph-node"
                    onPointerDown={(e) => handlePointerDown(node, e)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNodeClick(node);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startRename(node);
                    }}
                  >
                    <circle
                      r={isSelected ? SELECTED_RADIUS : NODE_RADIUS}
                      className={
                        isConnectSource
                          ? 'graph-node-circle connecting'
                          : isSelected
                            ? 'graph-node-circle selected'
                            : 'graph-node-circle'
                      }
                    />
                    <text className="graph-node-label" y={NODE_RADIUS + 16} textAnchor="middle">
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="node-inspector">
            {selected ? (
              <>
                {editingId === selected.id ? (
                  <div className="graph-rename-row">
                    <input
                      autoFocus
                      className="graph-rename-input"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <button onClick={commitRename} title="Save" aria-label="Save label">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingId(null)} title="Cancel" aria-label="Cancel rename">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <h4 onDoubleClick={() => startRename(selected)} title="Double-click to rename">
                    {selected.label}
                  </h4>
                )}
                {selected.type && <div className="node-meta">{selected.type}</div>}
                <button onClick={() => loadNeighbors(selected.id)}>Load Neighbors</button>
              </>
            ) : (
              <div>Select a node to inspect. Double-click a node to rename it.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
