import * as React from 'react';
import { Book } from 'lucide-react';

interface ResultCoverProps {
  src?: string;
  title: string;
}

export function ResultCover({ src, title }: ResultCoverProps) {
  const [error, setError] = React.useState(false);

  if (!src || error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface">
        <Book className="h-5 w-5 text-text-muted" aria-hidden="true" />
        <span className="sr-only">No cover for {title}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className="h-full w-full object-cover"
      onError={() => setError(true)}
    />
  );
}
