import { useMutation } from '@tanstack/react-query';
import { api, ApiClientError } from '../client';
import type { paths } from '../types';

export type SendBookPayload = paths['/api/send']['post']['requestBody']['content']['application/json'];

export function useSendBook() {
  return useMutation<unknown, ApiClientError, SendBookPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.POST('/api/send', { body: payload });
      return data;
    },
  });
}
