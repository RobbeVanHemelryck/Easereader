import * as React from 'react';
import { useToast } from '../stores/toastStore';
import { ApiClientError } from '../api/client';
import type { SourcePreferences } from '../lib/sourcePreferences';
import { buildDownloadUrl } from '../lib/sourcePreferences';

export type DownloadError = {
  message: string;
  htmlPreviewId?: string | null;
  retrySuggested?: boolean;
};

export function useDownload() {
  const toast = useToast();
  const [lastError, setLastError] = React.useState<DownloadError | null>(null);

  const download = React.useCallback(
    async (params: SourcePreferences & { dl: string; title?: string }) => {
      setLastError(null);
      try {
        const url = buildDownloadUrl(params);
        const response = await fetch(url);
        if (!response.ok) {
          throw await parseFetchError(response);
        }
        const blob = await response.blob();
        const disposition = response.headers.get('content-disposition');
        const filename = parseFilename(disposition) || `${params.title || 'ebook'}.epub`;
        triggerDownload(blob, filename);
        toast.success('Download started', filename);
      } catch (err) {
        const error: DownloadError =
          err instanceof ApiClientError
            ? {
                message: err.message,
                htmlPreviewId: err.htmlPreviewId,
                retrySuggested: err.retrySuggested,
              }
            : { message: err instanceof Error ? err.message : 'An unexpected error occurred' };
        setLastError(error);
        toast.error('Download failed', error.message);
      }
    },
    [toast]
  );

  const clearError = React.useCallback(() => setLastError(null), []);

  return { download, lastError, clearError };
}

async function parseFetchError(response: Response): Promise<ApiClientError> {
  const status = response.status;
  let message = response.statusText || `HTTP ${status}`;
  let htmlPreviewId: string | null | undefined;
  let retrySuggested: boolean | undefined;

  try {
    const data = (await response.json()) as Record<string, unknown>;
    if (typeof data.error === 'string') message = data.error;
    if (typeof data.htmlPreviewId === 'string' || data.htmlPreviewId === null) {
      htmlPreviewId = data.htmlPreviewId;
    }
    if (typeof data.retrySuggested === 'boolean') retrySuggested = data.retrySuggested;
  } catch {
    // ignore
  }

  return new ApiClientError({ message, status, htmlPreviewId, retrySuggested });
}

function parseFilename(disposition: string | null): string | null {
  if (!disposition) return null;
  const match = /filename="?([^";]+)"?/.exec(disposition);
  return match?.[1] ?? null;
}

function triggerDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}
