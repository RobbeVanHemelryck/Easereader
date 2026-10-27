import * as React from 'react';
import { Send, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { useSendBook } from '../../api/mutations/sendBook';
import type { components } from '../../api/types';
import { Button } from '../ui/Button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/Tooltip';
import { useToast } from '../../stores/toastStore';
import type { SourcePreferences } from '../../lib/sourcePreferences';
import type { SearchResult } from '../search/ResultCard';

interface SendToProfileButtonProps {
  profile: components['schemas']['Profile'];
  result: SearchResult;
  preferences: SourcePreferences;
}

export function SendToProfileButton({ profile, result, preferences }: SendToProfileButtonProps) {
  const toast = useToast();
  const send = useSendBook();
  const [lastStatus, setLastStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [lastError, setLastError] = React.useState<Error | null>(null);

  const handleClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setLastStatus('idle');
    setLastError(null);
    try {
      await send.mutateAsync({
        dl: result.dl,
        title: result.title,
        profileId: profile.id,
        strategy: preferences.strategy,
        zlibraryUrl: preferences.zlibraryUrl,
        sourceUrl: preferences.sourceUrl,
      });
      setLastStatus('success');
      toast.success(`Sent to ${profile.name}`, result.title);
    } catch (err) {
      setLastStatus('error');
      setLastError(err instanceof Error ? err : new Error('Send failed'));
      const message = err instanceof Error ? err.message : 'Send failed';
      toast.error(`Send to ${profile.name} failed`, message);
    }
  };

  const statusIcon =
    send.isPending ? (
      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
    ) : lastStatus === 'success' ? (
      <Check className="h-3.5 w-3.5" />
    ) : lastStatus === 'error' ? (
      <AlertCircle className="h-3.5 w-3.5" />
    ) : (
      <Send className="h-3.5 w-3.5" />
    );

  const error = send.error ?? lastError;
  const htmlPreviewId = 'htmlPreviewId' in (error ?? {}) ? (error as { htmlPreviewId?: string | null }).htmlPreviewId : undefined;
  const retrySuggested = 'retrySuggested' in (error ?? {}) ? (error as { retrySuggested?: boolean }).retrySuggested : false;

  return (
    <span className="inline-flex flex-col gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => void handleClick(e)}
              disabled={send.isPending}
              aria-label={`Send ${result.title} to ${profile.name}`}
            >
              {statusIcon}
              {profile.name}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Send to {profile.destEmail}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {lastStatus === 'error' && error && (
        <span className="flex max-w-[200px] flex-wrap items-center gap-1 text-xs text-destructive">
          <span className="line-clamp-2">{error.message}</span>
          {retrySuggested && <span className="text-text-secondary">Temporary issue — retry shortly.</span>}
          {htmlPreviewId && (
            <a
              href={`/api/debug/html/${htmlPreviewId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              Debug preview
            </a>
          )}
        </span>
      )}
    </span>
  );
}
