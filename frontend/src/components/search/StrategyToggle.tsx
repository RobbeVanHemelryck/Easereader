import { BookOpen, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { SourcePreferences } from '../../lib/sourcePreferences';

interface StrategyToggleProps {
  value: SourcePreferences['strategy'] | undefined;
  disabled?: boolean;
  onChange: (strategy: SourcePreferences['strategy']) => void;
}

const STRATEGIES = [
  { id: 'zlibrary', label: 'Z-Library', icon: Zap },
  { id: 'source', label: "Anna's Archive", icon: BookOpen },
] as const;

export function StrategyToggle({ value, disabled, onChange }: StrategyToggleProps) {
  return (
    <div className="inline-flex shrink-0 rounded-md border border-border p-0.5" role="group" aria-label="Book source">
      {STRATEGIES.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            disabled={disabled}
            aria-pressed={active}
            className={cn(
              'flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-1 text-xs transition-colors duration-150 disabled:opacity-50 sm:gap-1.5 sm:px-2.5',
              active ? 'bg-surface-elevated text-text-primary' : 'text-text-muted hover:text-text-secondary'
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
