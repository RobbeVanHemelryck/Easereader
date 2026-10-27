import * as React from 'react';

export type DownloadProgressStage =
  | 'download_page_loaded'
  | 'timer'
  | 'download_started'
  | 'download_finished'
  | 'error';

export type DownloadProgressEvent = {
  type: 'download_progress';
  bookId: string;
  stage: DownloadProgressStage;
  waitSeconds?: number;
  message?: string;
  timestamp: string;
};

const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/download-progress`;

export function useDownloadProgress() {
  const [events, setEvents] = React.useState<DownloadProgressEvent[]>([]);
  const [connected, setConnected] = React.useState(false);
  const wsRef = React.useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    let isActive = true;

    const connect = () => {
      if (!isActive || wsRef.current?.readyState === WebSocket.OPEN) return;

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as Record<string, unknown>;
          if (data.type !== 'download_progress') return;
          const bookId = typeof data.bookId === 'string' ? data.bookId : '';
          const stage = typeof data.stage === 'string' ? data.stage : '';
          const timestamp = typeof data.timestamp === 'string' ? data.timestamp : new Date().toISOString();
          const progressEvent: DownloadProgressEvent = {
            type: 'download_progress',
            bookId,
            stage: stage as DownloadProgressStage,
            waitSeconds: typeof data.waitSeconds === 'number' ? data.waitSeconds : undefined,
            message: typeof data.message === 'string' ? data.message : undefined,
            timestamp,
          };
          setEvents((prev) => [...prev, progressEvent]);
        } catch {
          // ignore invalid messages
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        if (isActive) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        // onclose will handle reconnect
      };
    };

    connect();

    return () => {
      isActive = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, []);

  const eventsByBook = React.useMemo(() => {
    const map = new Map<string, DownloadProgressEvent[]>();
    for (const event of events) {
      const list = map.get(event.bookId) ?? [];
      list.push(event);
      map.set(event.bookId, list);
    }
    return map;
  }, [events]);

  const clear = React.useCallback(() => setEvents([]), []);

  return { events, eventsByBook, connected, clear };
}
