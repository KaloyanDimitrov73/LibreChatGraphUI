import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RETRIEVAL_SETTINGS_KEY, type RetrievalSettings } from './queries';

export function useUpdateRetrievalSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<RetrievalSettings>) => {
      const { data } = await axios.put<RetrievalSettings>('/api/retrieval/settings', payload, {
        withCredentials: true,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(RETRIEVAL_SETTINGS_KEY, data);
    },
  });
}

export interface RetrievalSearchResult {
  results: Array<{
    id: string;
    title: string;
    authors?: string[];
    score?: number;
    snippet?: string;
    url?: string;
  }>;
  graph?: {
    nodes: Array<{ id: string; label: string; type?: string }>;
    edges: Array<{ source: string; target: string; label?: string }>;
  };
}

export interface RetrievalSearchPayload {
  query: string;
  topK?: number;
  similarityThreshold?: number;
  corpus?: string;
}

export function useRetrievalSearchMutation() {
  return useMutation({
    mutationFn: async (payload: RetrievalSearchPayload) => {
      const { data } = await axios.post<RetrievalSearchResult>('/api/retrieval/search', payload, {
        withCredentials: true,
      });
      return data;
    },
  });
}
