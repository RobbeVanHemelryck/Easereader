import { useQuery } from '@tanstack/react-query';
import { api } from '../client';

export const bookSourcesQueryKey = ['book-sources'] as const;

export function useBookSources() {
  return useQuery({
    queryKey: bookSourcesQueryKey,
    queryFn: async () => {
      const { data } = await api.GET('/api/book-sources');
      return data ?? {};
    },
    staleTime: Infinity,
  });
}
