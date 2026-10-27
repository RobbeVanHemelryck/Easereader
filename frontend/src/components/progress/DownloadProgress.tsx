import * as React from 'react';
import { X, Activity, WifiOff, Clock, Download, CheckCircle } from 'lucide-react';
import { useDownloadProgress, type DownloadProgressEvent } from '../../hooks/useDownloadProgress';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

function stageIcon(stage: DownloadProgressEvent['stage']) {
  switch (stage) {
    case 'timer':
      return <Clock className="h-3.5 w-3.5" />;
    case 'download_started':
      return <Download className="h-3.5 w-3.5" />;
    case 'download_finished':
      return <CheckCircle className="h-3.5 w-3.5" />;
    default:
      return <Activity className="h-3.5 w-3.5" />;
  }
}

function stageText(event: DownloadProgressEvent): string {
  switch (event.stage) {
    case 'download_page_loaded':
      return 'Download page loaded';
    case 'timer':
      return event.waitSeconds ? `Waiting ${event.waitSeconds}s` : 'Waiting';
    case 'download_started':
      return 'Download started';
    case 'download_finished':
      return 'Download finished';
    case 'error':
      return event.message ?? 'Error';
    default:
      return event.stage;
  }
}

export function DownloadProgress() {
  const { events, eventsByBook, connected, clear } = useDownloadProgress();
  const [minimized, setMinimized] = React.useState(true);

  if (events.length === 0) return null;

  return (
    <section
      className="mt-6 rounded-lg border border-border bg-surface"
      aria-label="Download progress"
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <h2 className="text-xs font-normal text-text-secondary">Download progress</h2>
          {!connected && (
            <Badge variant="warning" className="gap-1">
              <WifiOff className="h-3 w-3" />
              Reconnecting
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setMinimized((v) => !v)}>
            {minimized ? 'Show' : 'Hide'}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={clear} aria-label="Clear progress log">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!minimized && (
        <div className="max-h-72 overflow-y-auto p-3">
          {Array.from(eventsByBook.entries()).map(([bookId, bookEvents]) => (
            <div key={bookId} className="mb-3 last:mb-0">
              <p className="truncate text-xs font-mono text-text-muted">{bookId}</p>
              <ul className="mt-1 space-y-1">
                {bookEvents.slice(-10).map((event, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="text-text-muted" aria-hidden="true">{stageIcon(event.stage)}</span>
                    <span className="tabular-nums text-text-muted">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                    <span>{stageText(event)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
