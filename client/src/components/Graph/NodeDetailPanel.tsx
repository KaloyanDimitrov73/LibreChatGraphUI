import { useGraphNodeQuery } from '~/data-provider/Graph/queries';

export default function NodeDetailPanel({ nodeId }: { nodeId: string | null }) {
  const { data, isLoading, isError } = useGraphNodeQuery(nodeId);

  if (!nodeId) {
    return <div className="p-4 text-sm text-text-secondary">Click a node to load its details from the backend.</div>;
  }
  if (isLoading) {
    return <div className="p-4 text-sm text-text-secondary">Loading node…</div>;
  }
  if (isError || !data) {
    return <div className="p-4 text-sm text-red-500">Could not load this node.</div>;
  }

  return (
    <div className="space-y-2 overflow-y-auto p-4">
      <h3 className="text-sm font-semibold text-text-primary">{data.label}</h3>
      {data.type && <p className="text-xs uppercase text-text-secondary">{data.type}</p>}
      {data.description && <p className="text-sm text-text-primary">{data.description}</p>}
      {data.properties && (
        <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
          {Object.entries(data.properties).map(([key, value]) => (
            <div key={key} className="contents">
              <dt className="text-text-secondary">{key}</dt>
              <dd className="text-text-primary">{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
