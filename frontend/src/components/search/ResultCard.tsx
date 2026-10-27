import { Download, ExternalLink } from 'lucide-react';
import type { components } from '../../api/types';
import { Button } from '../ui/Button';
import { ResultCover } from './ResultCover';
import { SendToProfileButton } from '../send/SendToProfileButton';
import type { SourcePreferences } from '../../lib/sourcePreferences';

export type SearchResult = components['schemas']['SearchResult'];

interface ResultCardProps {
  result: SearchResult;
  preferences: SourcePreferences;
  profiles: components['schemas']['Profile'][];
  onDownload: (params: SourcePreferences & { dl: string; title?: string }) => void;
  isDownloading?: boolean;
}

function clean(value: string | undefined): string | undefined {
  const stripped = value?.replace(/✅\s*/g, '').trim();
  return stripped && stripped !== '0' ? stripped : undefined;
}

export function ResultCard({ result, preferences, profiles, onDownload, isDownloading }: ResultCardProps) {
  // "King, Stephen [Stephen King]" → "King, Stephen"
  const author = clean(result.author)?.replace(/\s*\[[^\]]*\]\s*$/, '');
  const publisher = clean(result.publisher);
  const rawLanguage = clean(result.language);
  // "English [en]" → "English"; drop values that are clearly scraped garbage (file paths etc.)
  const language =
    rawLanguage && rawLanguage.length <= 25 && !/[\\/]/.test(rawLanguage)
      ? rawLanguage.replace(/\s*\[[a-z]{2,3}\]\s*/i, '').trim()
      : undefined;
  const facts = [result.extension || 'EPUB', clean(result.filesize), language, clean(result.year)].filter(Boolean);

  const handleDownload = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onDownload({
      ...preferences,
      dl: result.dl,
      title: result.title,
    });
  };

  return (
    <article className="flex min-w-0 gap-3.5 py-3.5">
      <div className="h-[92px] w-16 shrink-0 overflow-hidden rounded-md border border-border">
        <ResultCover src={result.cover} title={result.title} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="min-w-0 truncate text-[13px] font-medium text-text-primary">{result.title}</h3>
        {author && <p className="mt-0.5 truncate text-xs text-text-secondary">{author}</p>}
        <p
          className="mt-0.5 truncate text-[11px] tabular-nums text-text-muted"
          title={publisher}
        >
          {facts.join(' · ')}
        </p>
        {result.rating && <p className="mt-0.5 text-[11px] text-text-muted">{result.rating}</p>}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2.5">
          <Button
            variant="secondary"
            size="xs"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download className="h-3 w-3" />
            Download
          </Button>

          {result.url && (
            <Button
              variant="ghost"
              size="xs"
              asChild
            >
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                Source
              </a>
            </Button>
          )}

          {profiles.map((profile) => (
            <SendToProfileButton
              key={profile.id}
              profile={profile}
              result={result}
              preferences={preferences}
            />
          ))}
        </div>
      </div>
    </article>
  );
}
