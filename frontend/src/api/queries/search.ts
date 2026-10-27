import { useQuery } from '@tanstack/react-query';
import { api } from '../client';
import type { SearchParams } from '../../lib/sourcePreferences';

export function searchQueryKey(params: SearchParams) {
  return ['search', params] as const;
}

export function useSearch(params: SearchParams) {
  return useQuery({
    queryKey: searchQueryKey(params),
    queryFn: async () => {
      const { data } = await api.GET('/api/search', {
        params: {
          query: {
            q: params.q,
            strategy: params.strategy,
            zlibraryUrl: params.zlibraryUrl,
            sourceUrl: params.sourceUrl,
          },
        },
      });
      return data?.results ?? [];
    },
    enabled: params.q.trim().length > 0,
  });
}
