import axios from 'axios';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

export interface RetrievalSettings {
  _id?: string;
  user?: string;
  topK: number;
  similarityThreshold: number;
  corpus: string;
  autoRetrieve: boolean;
}

export interface RetrievalNode {
  id: string;
  title: string;
  type?: string;
  authors?: string[];
  url?: string;
  [key: string]: unknown;
}

export interface RetrievalNeighbors {
  nodes: RetrievalNode[];
  edges: Array<{ source: string; target: string; label?: string }>;
}

export const RETRIEVAL_SETTINGS_KEY = ['retrievalSettings'] as const;

export function useRetrievalSettingsQuery(options?: Partial<UseQueryOptions<RetrievalSettings>>) {
  return useQuery<RetrievalSettings>({
    queryKey: RETRIEVAL_SETTINGS_KEY,
    queryFn: async () => {
      const { data } = await axios.get<RetrievalSettings>('/api/retrieval/settings', {
        withCredentials: true,
      });
      return data;
    },
    ...options,
  });
}

export function useGraphNodeQuery(nodeId: string | null, options?: Partial<UseQueryOptions<RetrievalNode>>) {
  return useQuery<RetrievalNode>({
    queryKey: ['retrievalNode', nodeId],
    queryFn: async () => {
      const { data } = await axios.get<RetrievalNode>(`/api/retrieval/node/${nodeId}`, {
        withCredentials: true,
      });
      return data;
    },
    enabled: !!nodeId,
    ...options,
  });
}

export function useGraphNeighborsQuery(
  nodeId: string | null,
  depth = 1,
  options?: Partial<UseQueryOptions<RetrievalNeighbors>>,
) {
  return useQuery<RetrievalNeighbors>({
    queryKey: ['retrievalNeighbors', nodeId, depth],
    queryFn: async () => {
      const { data } = await axios.get<RetrievalNeighbors>(`/api/retrieval/node/${nodeId}/neighbors`, {
        params: { depth },
        withCredentials: true,
      });
      return data;
    },
    enabled: !!nodeId,
    ...options,
  });
}
