import { useRecoilState, useRecoilValue } from 'recoil';
import { X, RefreshCw } from 'lucide-react';
import GraphCanvas from './GraphCanvas';
import NodeDetailPanel from './NodeDetailPanel';
import { useGraphDataQuery } from '~/data-provider/Graph/queries';
import { useGraphEvent, emitGraphEvent } from '~/hooks/Graph/useGraphEvents';
import store from '~/store/graph';
import type { TGraphNode } from '~/common/graph-types';

export default function GraphPanel() {
  const [isOpen, setIsOpen] = useRecoilState(store.graphPanelOpen);
  const [selectedNodeId, setSelectedNodeId] = useRecoilState(store.graphSelectedNodeId);
  const width = useRecoilValue(store.graphPanelWidth);

  const { data, isLoading, isError, refetch, isFetching } = useGraphDataQuery();

  // Interop: a click on a chat-side node reference opens the panel and
  // selects that node, which triggers the REST detail fetch automatically.
  useGraphEvent('chat:view-graph', () => setIsOpen(true));

  if (!isOpen) return null;

  return (
    <aside
      style={{ width }}
      className="flex h-full flex-shrink-0 flex-col border-l border-border-medium bg-surface-primary"
      aria-label="Graph view"
    >
      <header className="flex items-center justify-between border-b border-border-light px-3 py-2">
        <h2 className="text-sm font-semibold text-text-primary">Graph</h2>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => refetch()} aria-label="Refresh graph" className="rounded p-1 hover:bg-surface-hover">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              emitGraphEvent('graph:panel-closed', undefined);
            }}
            aria-label="Close graph panel"
            className="rounded p-1 hover:bg-surface-hover"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        {isLoading && <div className="p-4 text-sm text-text-secondary">Loading graph…</div>}
        {isError && <div className="p-4 text-sm text-red-500">Could not load graph data.</div>}
        {data && (
          <GraphCanvas
            data={data}
            selectedNodeId={selectedNodeId}
            onSelectNode={(node: TGraphNode) => setSelectedNodeId(node.id)}
          />
        )}
      </div>

      <div className="max-h-56 flex-shrink-0 overflow-y-auto border-t border-border-light">
        <NodeDetailPanel nodeId={selectedNodeId} />
      </div>
    </aside>
  );
}
