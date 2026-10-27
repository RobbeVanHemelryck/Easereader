import createClient from 'openapi-fetch';
import type { paths } from './types';

export type ApiError = {
  message: string;
  status: number;
  htmlPreviewId?: string | null;
  retrySuggested?: boolean;
  puppeteerRestarted?: boolean;
};

export class ApiClientError extends Error {
  status: number;
  htmlPreviewId?: string | null;
  retrySuggested?: boolean;
  puppeteerRestarted?: boolean;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiClientError';
    this.status = error.status;
    this.htmlPreviewId = error.htmlPreviewId;
    this.retrySuggested = error.retrySuggested;
    this.puppeteerRestarted = error.puppeteerRestarted;
  }
}

export async function parseApiError(response: Response): Promise<ApiClientError> {
  const status = response.status;
  let message = response.statusText || `HTTP ${status}`;
  let htmlPreviewId: string | null | undefined;
  let retrySuggested: boolean | undefined;
  let puppeteerRestarted: boolean | undefined;

  try {
    const data = (await response.json()) as Record<string, unknown>;
    if (typeof data.error === 'string') {
      message = data.error;
    }
    if (typeof data.htmlPreviewId === 'string' || data.htmlPreviewId === null) {
      htmlPreviewId = data.htmlPreviewId;
    }
    if (typeof data.retrySuggested === 'boolean') {
      retrySuggested = data.retrySuggested;
    }
    if (typeof data.puppeteerRestarted === 'boolean') {
      puppeteerRestarted = data.puppeteerRestarted;
    }
  } catch {
    // keep defaults
  }

  return new ApiClientError({
    message,
    status,
    htmlPreviewId,
    retrySuggested,
    puppeteerRestarted,
  });
}

const client = createClient<paths>({
  baseUrl: '',
  headers: {
    Accept: 'application/json',
  },
});

client.use({
  async onResponse({ response }) {
    if (!response.ok) {
      throw await parseApiError(response);
    }
    return response;
  },
});

export const api = client;
