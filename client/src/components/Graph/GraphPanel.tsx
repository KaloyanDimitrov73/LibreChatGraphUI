import React, { useEffect, useState } from 'react';
import { emitGraphEvent } from '~/hooks/Graph/useGraphEvents';
import './GraphPanel.css';

type Node = {
  id: string;
  label?: string;
  meta?: any;
};

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

export default function GraphPanel({ open, context, onToggle, onNodeClick }: GraphPanelProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selected, setSelected] = useState<Node | null>(null);

  async function loadForContext(ctx: GraphContext) {
    try {
      const params = new URLSearchParams();
      if (ctx.conversationId) params.set('conversationId', ctx.conversationId);
      if (ctx.messageId) params.set('messageId', ctx.messageId);
      const url = params.toString()
        ? `/api/graph/node/root?${params.toString()}`
        : '/api/graph/node/root';
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed to load graph root');
      const data = await resp.json();
      setNodes(data.nodes || []);
      emitGraphEvent('graph:data-loaded', { data });
    } catch (err) {
      console.error('GraphPanel loadForContext', err);
    }
  }

  // Reset selection and reload whenever the panel opens, or the message/
  // conversation it's scoped to changes while already open.
  useEffect(() => {
    if (open) {
      setSelected(null);
      loadForContext(context);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, context.conversationId, context.messageId]);

  async function handleNodeClick(n: Node) {
    setSelected(n);
    if (onNodeClick) onNodeClick(n);
    emitGraphEvent('graph:node-click', { node: n as any });

    // optionally fetch more info for inspector panel
    try {
      const resp = await fetch(`/api/retrieval/node/${encodeURIComponent(n.id)}`);
      if (resp.ok) {
        const meta = await resp.json();
        setSelected({ ...n, meta });
      }
    } catch (err) {
      console.warn('node detail fetch failed', err);
    }
  }

  return (
    <div className="graph-panel">
      <div className="graph-header">
        <button
          aria-label="toggle-graph-panel"
          onClick={() => onToggle(!open)}
        >
          {open ? 'Hide Graph' : 'Show Graph'}
        </button>
      </div>

      {open && (
        <div className="graph-body">
          <div className="node-list">
            {nodes.length === 0 && <div className="empty">No nodes loaded</div>}
            {nodes.map((n) => (
              <div key={n.id} className="node-item" onClick={() => handleNodeClick(n)}>
                <strong>{n.label || n.id}</strong>
                <div className="node-meta">{n.meta?.short ?? ''}</div>
              </div>
            ))}
          </div>

          <div className="node-inspector">
            {selected ? (
              <>
                <h4>{selected.label || selected.id}</h4>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(selected.meta, null, 2)}</pre>
                <button
                  onClick={async () => {
                    // Ask retrieval backend for neighbors and expand
                    try {
                      const resp = await fetch(`/api/retrieval/node/${encodeURIComponent(selected.id)}/neighbors`, {
                        method: 'POST',
                      });
                      if (resp.ok) {
                        const data = await resp.json();
                        // merge new nodes
                        setNodes((prev) => {
                          const ids = new Set(prev.map((p) => p.id));
                          const extras = (data.nodes || []).filter((m) => !ids.has(m.id));
                          return prev.concat(extras);
                        });
                      }
                    } catch (err) {
                      console.warn('expand neighbors failed', err);
                    }
                  }}
                >
                  Load Neighbors
                </button>
              </>
            ) : (
              <div>Select a node to inspect</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
