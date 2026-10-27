import { useQuery } from '@tanstack/react-query';
import { api } from '../client';

export const profilesQueryKey = ['profiles'] as const;

export function useProfiles() {
  return useQuery({
    queryKey: profilesQueryKey,
    queryFn: async () => {
      const { data } = await api.GET('/api/profiles');
      return data ?? [];
    },
  });
}
