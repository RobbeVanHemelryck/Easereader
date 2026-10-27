import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 border-t border-border py-14 text-center">
      <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
      <p className="max-w-md text-xs text-text-secondary">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry} className="mt-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
