import * as React from 'react';
import { useBookSources as useBookSourcesQuery } from '../api/queries/bookSources';
import type { SourcePreferences } from '../lib/sourcePreferences';
import {
  getDefaultPreferences,
  getSourcePreferencesSnapshot,
  loadSourcePreferences,
  saveSourcePreferences,
  subscribeSourcePreferences,
  validateAndNormalizePreferences,
} from '../lib/sourcePreferences';

export function useBookSources() {
  const { data: options, isLoading, error } = useBookSourcesQuery();

  const saved = React.useSyncExternalStore(subscribeSourcePreferences, getSourcePreferencesSnapshot);
  const preferences = React.useMemo(() => {
    if (!options) return null;
    return validateAndNormalizePreferences(
      loadSourcePreferences(saved) ?? getDefaultPreferences(options),
      options
    );
  }, [options, saved]);

  React.useEffect(() => {
    if (preferences) saveSourcePreferences(preferences);
  }, [preferences]);

  const setPreferences = React.useCallback(
    (next: SourcePreferences) => {
      if (!options) return;
      const validated = validateAndNormalizePreferences(next, options);
      saveSourcePreferences(validated);
    },
    [options]
  );

  const setStrategy = React.useCallback(
    (strategy: SourcePreferences['strategy']) => {
      if (!preferences) return;
      setPreferences({ ...preferences, strategy });
    },
    [preferences, setPreferences]
  );

  const setZlibraryUrl = React.useCallback(
    (zlibraryUrl: string) => {
      if (!preferences) return;
      setPreferences({ ...preferences, zlibraryUrl });
    },
    [preferences, setPreferences]
  );

  const setSourceUrl = React.useCallback(
    (sourceUrl: string) => {
      if (!preferences) return;
      setPreferences({ ...preferences, sourceUrl });
    },
    [preferences, setPreferences]
  );

  return {
    options: options ?? { zlibrary: [], AnnasArchive: [] },
    isLoading,
    error,
    preferences,
    setStrategy,
    setZlibraryUrl,
    setSourceUrl,
  };
}
