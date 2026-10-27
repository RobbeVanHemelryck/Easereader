import type { components } from '../api/types';

export type BookSourceOptions = components['schemas']['BookSourceOptions'];

export type SearchParams = {
  q: string;
  strategy: 'zlibrary' | 'source';
  zlibraryUrl: string;
  sourceUrl: string;
};

export type SourcePreferences = {
  strategy: SearchParams['strategy'];
  zlibraryUrl: string;
  sourceUrl: string;
};

export const STORAGE_KEY = 'easereader.bookSources';
const CHANGE_EVENT = 'easereader:book-sources-changed';

export function subscribeSourcePreferences(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.storageArea === localStorage && (event.key === STORAGE_KEY || event.key === null)) {
      onChange();
    }
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function getSourcePreferencesSnapshot(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

const DEFAULT_STRATEGY: SourcePreferences['strategy'] = 'source';
const PREFERENCES_VERSION = 2;

export function getDefaultPreferences(options: BookSourceOptions): SourcePreferences {
  const zlibrary = options.zlibrary?.[0]?.url ?? '';
  const source = options.AnnasArchive?.[0]?.url ?? '';
  return {
    strategy: DEFAULT_STRATEGY,
    zlibraryUrl: zlibrary,
    sourceUrl: source,
  };
}

export function loadSourcePreferences(raw = getSourcePreferencesSnapshot()): SourcePreferences | null {
  try {
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' &&
        ('strategy' in parsed || 'zlibraryUrl' in parsed || 'sourceUrl' in parsed)) {
      const previous = parsed as Partial<SourcePreferences>;
      return {
        strategy: previous.strategy === 'source' || previous.strategy === 'zlibrary'
          ? previous.strategy : DEFAULT_STRATEGY,
        zlibraryUrl: typeof previous.zlibraryUrl === 'string' ? previous.zlibraryUrl : '',
        sourceUrl: typeof previous.sourceUrl === 'string' ? previous.sourceUrl : '',
      };
    }
  } catch {
    // ignore corrupt storage
  }
  return null;
}

export function saveSourcePreferences(preferences: SourcePreferences): void {
  const serialized = JSON.stringify({ ...preferences, version: PREFERENCES_VERSION });
  if (getSourcePreferencesSnapshot() === serialized) return;
  localStorage.setItem(STORAGE_KEY, serialized);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function validateAndNormalizePreferences(
  preferences: SourcePreferences,
  options: BookSourceOptions
): SourcePreferences {
  const allowedZlibrary = new Set((options.zlibrary ?? []).map((o) => o.url));
  const allowedSource = new Set((options.AnnasArchive ?? []).map((o) => o.url));

  return {
    strategy: preferences.strategy,
    zlibraryUrl: allowedZlibrary.has(preferences.zlibraryUrl)
      ? preferences.zlibraryUrl
      : (options.zlibrary?.[0]?.url ?? preferences.zlibraryUrl),
    sourceUrl: allowedSource.has(preferences.sourceUrl)
      ? preferences.sourceUrl
      : (options.AnnasArchive?.[0]?.url ?? preferences.sourceUrl),
  };
}

export function resolveSourcePreferences(
  options: BookSourceOptions,
  overrides?: Partial<SourcePreferences>
): SourcePreferences {
  const saved = loadSourcePreferences();
  const defaults = getDefaultPreferences(options);

  let merged: SourcePreferences = {
    ...defaults,
    ...(saved ?? {}),
    ...overrides,
  };

  merged = validateAndNormalizePreferences(merged, options);

  if (JSON.stringify(merged) !== JSON.stringify(saved)) {
    saveSourcePreferences(merged);
  }

  return merged;
}

export function buildDownloadUrl(params: SourcePreferences & { dl: string; title?: string }): string {
  const search = new URLSearchParams();
  search.set('dl', params.dl);
  if (params.title) search.set('title', params.title);
  search.set('strategy', params.strategy);
  search.set('zlibraryUrl', params.zlibraryUrl);
  search.set('sourceUrl', params.sourceUrl);
  return `/api/download?${search.toString()}`;
}
