import * as React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { components } from '../../api/types';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { ProfileForm, type ProfileFormData } from './ProfileForm';
import { useUpdateProfile, useDeleteProfile } from '../../api/mutations/profileMutations';
import { useToast } from '../../stores/toastStore';

interface ProfileListProps {
  profiles: components['schemas']['Profile'][];
  senders: components['schemas']['Sender'][];
}

export function ProfileList({ profiles, senders }: ProfileListProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const updateProfile = useUpdateProfile(editingId ?? '');
  const deleteProfile = useDeleteProfile();
  const toast = useToast();

  const handleUpdate = async (data: ProfileFormData) => {
    if (!editingId) return;
    try {
      await updateProfile.mutateAsync(data);
      setEditingId(null);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to update profile', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this profile?')) return;
    try {
      await deleteProfile.mutateAsync(id);
      toast.success('Profile deleted');
    } catch (err) {
      toast.error('Failed to delete profile', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="space-y-3">
      {profiles.map((profile) => (
        <div key={profile.id} className="rounded-lg border border-border bg-surface-elevated p-3">
          {editingId === profile.id ? (
            <ProfileForm
              senders={senders}
              initial={profile}
              onSubmit={(data) => void handleUpdate(data)}
              onCancel={() => setEditingId(null)}
              isLoading={updateProfile.isPending}
            />
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={profile.name} src={profile.imagePath} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">{profile.name}</p>
                  <p className="truncate text-xs text-text-secondary">
                    {profile.destEmail} · {profile.senderLabel}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEditingId(profile.id)}
                  aria-label={`Edit ${profile.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => void handleDelete(profile.id)}
                  aria-label={`Delete ${profile.name}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
      {profiles.length === 0 && <p className="text-sm text-text-secondary">No profiles configured yet.</p>}
    </div>
  );
}
