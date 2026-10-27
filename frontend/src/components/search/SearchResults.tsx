import { useSearch } from '../../api/queries/search';
import { Skeleton } from '../ui/Skeleton';
import { ResultCard } from './ResultCard';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import type { SourcePreferences } from '../../lib/sourcePreferences';
import type { components } from '../../api/types';

interface SearchResultsProps {
  params: SourcePreferences & { q: string };
  profiles: components['schemas']['Profile'][];
  onDownload: (params: SourcePreferences & { dl: string; title?: string }) => void;
}

const SKELETON_WIDTHS: [string, string][] = [
  ['w-2/5', 'w-1/4'],
  ['w-1/2', 'w-1/5'],
  ['w-1/3', 'w-1/4'],
  ['w-2/5', 'w-1/6'],
  ['w-1/2', 'w-1/4'],
];

function ResultSkeleton({ index }: { index: number }) {
  const [titleWidth, authorWidth] = SKELETON_WIDTHS[index % SKELETON_WIDTHS.length];
  return (
    <div className="flex gap-3.5 py-3.5" aria-hidden="true">
      <Skeleton className="h-[92px] w-16 shrink-0 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 py-0.5">
        <Skeleton className={`h-3 rounded ${titleWidth}`} />
        <Skeleton className={`h-2.5 rounded ${authorWidth}`} />
        <Skeleton className="h-2.5 w-1/3 rounded" />
        <div className="mt-auto flex gap-1.5 pt-1.5">
          <Skeleton className="h-6 w-[74px] rounded-md" />
          <Skeleton className="h-6 w-14 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function SearchResults({ params, profiles, onDownload }: SearchResultsProps) {
  const { data: results, isLoading, error, refetch } = useSearch(params);
  const hasQuery = params.q.trim().length > 0;

  if (isLoading) {
    return (
      <div className="divide-y divide-border border-t border-border" role="status" aria-label="Searching">
        <span className="sr-only">Searching…</span>
        {Array.from({ length: 5 }).map((_, i) => (
          <ResultSkeleton key={i} index={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={() => void refetch()} />;
  }

  if (!hasQuery || !results || results.length === 0) {
    return <EmptyState hasQuery={hasQuery} />;
  }

  return (
    <div className="divide-y divide-border border-t border-border">
      {results.map((result, index) => (
        <ResultCard
          key={`${result.dl}-${index}`}
          result={result}
          preferences={params}
          profiles={profiles}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
}
