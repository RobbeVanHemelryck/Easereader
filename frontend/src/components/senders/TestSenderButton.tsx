import * as React from 'react';
import { Mail } from 'lucide-react';
import type { components } from '../../api/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useTestSender } from '../../api/mutations/senderMutations';
import { useToast } from '../../stores/toastStore';

interface TestSenderButtonProps {
  sender: components['schemas']['Sender'];
}

export function TestSenderButton({ sender }: TestSenderButtonProps) {
  const [destEmail, setDestEmail] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const test = useTestSender(sender.id);
  const toast = useToast();

  const handleTest = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await test.mutateAsync({ destEmail });
      toast.success('Test email sent', `Check ${destEmail}`);
      setOpen(false);
    } catch (err) {
      toast.error('Test failed', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <span className="inline-flex items-center gap-1">
      {open ? (
        <form onSubmit={(e) => void handleTest(e)} className="flex items-center gap-1">
          <Input
            type="email"
            placeholder="test@example.com"
            value={destEmail}
            onChange={(e) => setDestEmail(e.target.value)}
            required
            className="h-8 w-40 text-xs"
          />
          <Button type="submit" size="sm" isLoading={test.isPending} className="h-8">Send</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} className="h-8">Cancel</Button>
        </form>
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen(true)}
          aria-label={`Test ${sender.user}`}
        >
          <Mail className="h-4 w-4" />
        </Button>
      )}
    </span>
  );
}
