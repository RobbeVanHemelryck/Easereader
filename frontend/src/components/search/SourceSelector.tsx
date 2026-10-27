import { Select } from '../ui/Select';
import { StrategyToggle } from './StrategyToggle';
import type { SourcePreferences } from '../../lib/sourcePreferences';

interface SourceSelectorProps {
  options: {
    zlibrary?: { label: string; url: string }[];
    AnnasArchive?: { label: string; url: string }[];
  };
  preferences: SourcePreferences | null;
  disabled?: boolean;
  onStrategyChange: (strategy: SourcePreferences['strategy']) => void;
  onZlibraryUrlChange: (url: string) => void;
  onSourceUrlChange: (url: string) => void;
}

export function SourceSelector({
  options,
  preferences,
  disabled,
  onStrategyChange,
  onZlibraryUrlChange,
  onSourceUrlChange,
}: SourceSelectorProps) {
  const zlibraryOptions = options.zlibrary ?? [];
  const sourceOptions = options.AnnasArchive ?? [];

  return (
    <div className="space-y-3">
      <StrategyToggle value={preferences?.strategy} disabled={disabled} onChange={onStrategyChange} />

      <p className="text-[11px] leading-4 text-text-muted">
        {preferences?.strategy === 'zlibrary'
          ? 'Z-Library is faster but less stable. Results may vary per domain.'
          : "Anna's Archive is slower and may require a countdown, but is generally more stable."}
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <Select
          label="Z-Library domain"
          value={preferences?.zlibraryUrl ?? ''}
          onChange={(e) => onZlibraryUrlChange(e.target.value)}
          disabled={disabled || zlibraryOptions.length === 0}
        >
          {zlibraryOptions.map((option) => (
            <option key={option.url} value={option.url}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          label="Anna's Archive domain"
          value={preferences?.sourceUrl ?? ''}
          onChange={(e) => onSourceUrlChange(e.target.value)}
          disabled={disabled || sourceOptions.length === 0}
        >
          {sourceOptions.map((option) => (
            <option key={option.url} value={option.url}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
