import { useQuery } from '@tanstack/react-query';
import { api } from '../client';

export const sendersQueryKey = ['senders'] as const;

export function useSenders() {
  return useQuery({
    queryKey: sendersQueryKey,
    queryFn: async () => {
      const { data } = await api.GET('/api/senders');
      return data ?? [];
    },
  });
}
