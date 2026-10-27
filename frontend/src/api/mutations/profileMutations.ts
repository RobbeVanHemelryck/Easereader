import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiClientError } from '../client';
import { profilesQueryKey } from '../queries/profiles';

export type ProfileInput = {
  name: string;
  destEmail: string;
  senderId: string;
  image?: File;
};

function buildProfileFormData(input: ProfileInput): FormData {
  const formData = new FormData();
  formData.append('name', input.name);
  formData.append('destEmail', input.destEmail);
  formData.append('senderId', input.senderId);
  if (input.image) {
    formData.append('image', input.image);
  }
  return formData;
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiClientError, ProfileInput>({
    mutationFn: async (input) => {
      const { data } = await api.POST('/api/profiles', {
        // openapi-fetch typed body for multipart is tricky; cast to unknown
        body: buildProfileFormData(input) as unknown as never,
        headers: {},
      });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profilesQueryKey }),
  });
}

export function useUpdateProfile(id: string) {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiClientError, ProfileInput>({
    mutationFn: async (input) => {
      const { data } = await api.PUT('/api/profiles/{id}', {
        params: { path: { id } },
        body: buildProfileFormData(input) as unknown as never,
        headers: {},
      });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profilesQueryKey }),
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiClientError, string>({
    mutationFn: async (id) => {
      const { data } = await api.DELETE('/api/profiles/{id}', {
        params: { path: { id } },
      });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profilesQueryKey }),
  });
}
