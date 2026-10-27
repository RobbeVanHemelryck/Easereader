import * as React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { SearchForm } from './SearchForm';
import { SearchResults } from './SearchResults';
import { StrategyToggle } from './StrategyToggle';
import { useBookSources } from '../../hooks/useBookSources';
import { useProfiles } from '../../api/queries/profiles';
import { useDownload } from '../../hooks/useDownload';
import { DownloadProgress } from '../progress/DownloadProgress';
import { openSettings } from '../../stores/settingsStore';

export function SearchPage() {
  const [query, setQuery] = React.useState('');

  const { options, isLoading: sourcesLoading, preferences, setStrategy } = useBookSources();
  const { data: profiles = [] } = useProfiles();
  const { download } = useDownload();

  const activeDomainLabel = React.useMemo(() => {
    if (!preferences) return '';
    const domainUrl = preferences.strategy === 'zlibrary' ? preferences.zlibraryUrl : preferences.sourceUrl;
    const domainOptions = preferences.strategy === 'zlibrary' ? options.zlibrary ?? [] : options.AnnasArchive ?? [];
    return domainOptions.find((o) => o.url === domainUrl)?.label ?? domainUrl;
  }, [preferences, options]);

  return (
    <div className="space-y-4">
      <SearchForm
        initialQuery={query}
        isLoading={sourcesLoading}
        onSearch={setQuery}
      />

      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        <StrategyToggle
          value={preferences?.strategy}
          disabled={sourcesLoading}
          onChange={setStrategy}
        />
        <button
          type="button"
          onClick={() => openSettings('sources')}
          className="ml-auto flex min-w-0 items-center gap-1.5 rounded-md px-1 py-1 text-xs text-text-muted transition-colors duration-150 hover:text-text-secondary sm:px-1.5"
        >
          <span className="truncate">{activeDomainLabel}</span>
          <SlidersHorizontal className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="sr-only">Manage book source domains</span>
        </button>
      </div>

      {preferences && (
        <SearchResults
          params={{ q: query, ...preferences }}
          profiles={profiles}
          onDownload={(params) => void download(params)}
        />
      )}

      <DownloadProgress />
    </div>
  );
}
