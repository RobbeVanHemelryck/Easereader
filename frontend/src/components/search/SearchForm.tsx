import * as React from 'react';
import { Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface SearchFormProps {
  initialQuery: string;
  isLoading: boolean;
  onSearch: (query: string) => void;
}

export function SearchForm({ initialQuery, isLoading, onSearch }: SearchFormProps) {
  const [query, setQuery] = React.useState(initialQuery);

  React.useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-1.5">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" aria-hidden="true" />
        <Input
          type="search"
          placeholder="Search by title, author, or ISBN"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 rounded-lg pl-8"
          aria-label="Search by title, author, or ISBN"
        />
      </div>
      <Button type="submit" isLoading={isLoading} disabled={isLoading || !query.trim()} className="h-9 rounded-lg px-4">
        Search
      </Button>
    </form>
  );
}
