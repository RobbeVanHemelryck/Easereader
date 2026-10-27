import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiClientError } from '../client';
import { sendersQueryKey } from '../queries/senders';
import { profilesQueryKey } from '../queries/profiles';
import type { paths } from '../types';

export type SenderInput = paths['/api/senders']['post']['requestBody']['content']['application/json'];

export function useCreateSender() {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiClientError, SenderInput>({
    mutationFn: async (body) => {
      const { data } = await api.POST('/api/senders', { body });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sendersQueryKey }),
  });
}

export function useUpdateSender(id: string) {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiClientError, SenderInput>({
    mutationFn: async (body) => {
      const { data } = await api.PUT('/api/senders/{id}', {
        params: { path: { id } },
        body,
      });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sendersQueryKey }),
  });
}

export function useDeleteSender() {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiClientError, string>({
    mutationFn: async (id) => {
      const { data } = await api.DELETE('/api/senders/{id}', {
        params: { path: { id } },
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sendersQueryKey });
      void queryClient.invalidateQueries({ queryKey: profilesQueryKey });
    },
  });
}

export function useTestSender(id: string) {
  return useMutation<unknown, ApiClientError, { destEmail: string }>({
    mutationFn: async (body) => {
      const { data } = await api.POST('/api/senders/{id}/test', {
        params: { path: { id } },
        body,
      });
      return data;
    },
  });
}
