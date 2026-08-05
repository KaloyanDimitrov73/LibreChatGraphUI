import { useQuery } from '@tanstack/react-query';
import type { TGraphData, TGraphNodeDetail } from '~/common/graph-types';

const GRAPH_BASE_URL = '/api/graph';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include', // reuse the existing session/JWT cookie
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Graph request failed (${response.status}): ${url}`);
  }
  return response.json() as Promise<T>;
}

/** Loads the full node/edge set rendered by <GraphCanvas />. */
export function useGraphDataQuery() {
  return useQuery<TGraphData>({
    queryKey: ['graphData'],
    queryFn: () => fetchJson<TGraphData>(GRAPH_BASE_URL),
    staleTime: 60_000,
  });
}

/** Loads extra detail for a single node after the user clicks it. */
export function useGraphNodeQuery(nodeId: string | null) {
  return useQuery<TGraphNodeDetail>({
    queryKey: ['graphNode', nodeId],
    queryFn: () => fetchJson<TGraphNodeDetail>(`${GRAPH_BASE_URL}/nodes/${nodeId}`),
    enabled: nodeId != null,
  });
}
