import { Search } from 'lucide-react';

interface EmptyStateProps {
  hasQuery: boolean;
}

export function EmptyState({ hasQuery }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 border-t border-border py-16 text-center">
      <Search className="h-4 w-4 text-text-muted" aria-hidden="true" />
      <p className="text-xs text-text-muted">
        {hasQuery ? 'No results found. Try a different query or source.' : 'Enter a title, author, or ISBN to start searching.'}
      </p>
    </div>
  );
}
