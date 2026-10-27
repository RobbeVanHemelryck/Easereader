import * as React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { components } from '../../api/types';
import { Button } from '../ui/Button';
import { SenderForm, type SenderFormData } from './SenderForm';
import {
  useDeleteSender,
  useUpdateSender,
} from '../../api/mutations/senderMutations';
import { useToast } from '../../stores/toastStore';
import { TestSenderButton } from './TestSenderButton';

interface SenderListProps {
  senders: components['schemas']['Sender'][];
}

export function SenderList({ senders }: SenderListProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const updateSender = useUpdateSender(editingId ?? '');
  const deleteSender = useDeleteSender();
  const toast = useToast();

  const handleUpdate = async (data: SenderFormData) => {
    if (!editingId) return;
    try {
      await updateSender.mutateAsync(data);
      setEditingId(null);
      toast.success('Sender updated');
    } catch (err) {
      toast.error('Failed to update sender', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sender? Any profiles using it will also be deleted.')) return;
    try {
      await deleteSender.mutateAsync(id);
      toast.success('Sender deleted');
    } catch (err) {
      toast.error('Failed to delete sender', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (senders.length === 0) {
    return <p className="text-sm text-text-secondary">No senders configured yet.</p>;
  }

  return (
    <div className="space-y-3">
      {senders.map((sender) => (
        <div key={sender.id} className="rounded-lg border border-border bg-surface-elevated p-3">
          {editingId === sender.id ? (
            <SenderForm
              initial={sender}
              onSubmit={(data) => void handleUpdate(data)}
              onCancel={() => setEditingId(null)}
              isLoading={updateSender.isPending}
            />
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">{sender.user}</p>
                <p className="truncate text-xs text-text-secondary">
                  {sender.host}:{sender.port} · {sender.secure ? 'SSL/TLS' : 'STARTTLS'}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <TestSenderButton sender={sender} />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEditingId(sender.id)}
                  aria-label={`Edit ${sender.user}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => void handleDelete(sender.id)}
                  aria-label={`Delete ${sender.user}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
