import * as React from 'react';
import type { components } from '../../api/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Avatar } from '../ui/Avatar';
import { MAX_PROFILE_IMAGE_SIZE } from '../../lib/constants';

export type ProfileFormData = {
  name: string;
  destEmail: string;
  senderId: string;
  image?: File;
};

interface ProfileFormProps {
  senders: components['schemas']['Sender'][];
  initial?: components['schemas']['Profile'];
  onSubmit: (data: ProfileFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProfileForm({ senders, initial, onSubmit, onCancel, isLoading }: ProfileFormProps) {
  const [data, setData] = React.useState<ProfileFormData>({
    name: initial?.name ?? '',
    destEmail: initial?.destEmail ?? '',
    senderId: initial?.senderId ?? '',
  });
  const [preview, setPreview] = React.useState<string | null>(initial?.imagePath ?? null);
  const [imageError, setImageError] = React.useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImageError(null);
    if (!file) {
      setData((prev) => ({ ...prev, image: undefined }));
      setPreview(initial?.imagePath ?? null);
      return;
    }
    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      setImageError('Image must be smaller than 5 MiB.');
      return;
    }
    setData((prev) => ({ ...prev, image: file }));
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(data);
  };

  if (senders.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface-elevated p-3 text-sm text-text-secondary">
        Add at least one sender before creating a profile.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar name={data.name || '?'} src={preview} size="lg" />
        <div className="flex-1">
          <label htmlFor="profile-image" className="text-xs text-text-secondary">Profile image (optional, max 5 MiB)</label>
          <Input id="profile-image" type="file" accept="image/*" onChange={handleImageChange} className="h-auto py-1.5 text-xs" />
          {imageError && <p className="mt-1 text-xs text-destructive">{imageError}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="profile-name" className="text-xs text-text-secondary">Name</label>
          <Input
            id="profile-name"
            value={data.name}
            onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="profile-email" className="text-xs text-text-secondary">Device email</label>
          <Input
            id="profile-email"
            type="email"
            value={data.destEmail}
            onChange={(e) => setData((prev) => ({ ...prev, destEmail: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="profile-sender" className="text-xs text-text-secondary">Sender</label>
        <select
          id="profile-sender"
          value={data.senderId}
          onChange={(e) => setData((prev) => ({ ...prev, senderId: e.target.value }))}
          required
          className="flex h-9 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="" disabled>Select a sender</option>
          {senders.map((sender) => (
            <option key={sender.id} value={sender.id}>{sender.user}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={isLoading}>{initial ? 'Update profile' : 'Add profile'}</Button>
      </div>
    </form>
  );
}
