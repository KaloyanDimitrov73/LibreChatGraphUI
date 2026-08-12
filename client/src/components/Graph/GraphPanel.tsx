import React, { useEffect, useState } from 'react';
import './GraphPanel.css'; // you can style as needed

type Node = {
  id: string;
  label?: string;
  meta?: any;
};

export type GraphPanelProps = {
  visible?: boolean;
  onToggle?: (visible: boolean) => void;
  onNodeClick?: (node: Node) => void;
};

export default function GraphPanel({ visible = false, onToggle, onNodeClick }: GraphPanelProps) {
  const [open, setOpen] = useState(visible);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selected, setSelected] = useState<Node | null>(null);

  useEffect(() => setOpen(visible), [visible]);

  async function loadRoot() {
    try {
      const resp = await fetch('/api/graph/node/root'); // your backend should provide a root or initial graph
      if (!resp.ok) throw new Error('Failed to load graph root');
      const data = await resp.json();
      setNodes(data.nodes || []);
    } catch (err) {
      console.error('GraphPanel loadRoot', err);
    }
  }

  useEffect(() => {
    if (open) loadRoot();
  }, [open]);

  async function handleNodeClick(n: Node) {
    setSelected(n);
    if (onNodeClick) onNodeClick(n);

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
    <aside className={`graph-panel ${open ? 'open' : 'closed'}`}>
      <div className="graph-header">
        <button
          aria-label="toggle-graph-panel"
          onClick={() => {
            const next = !open;
            setOpen(next);
            if (onToggle) onToggle(next);
          }}
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
    </aside>
  );
}
