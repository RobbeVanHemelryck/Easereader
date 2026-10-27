import * as React from 'react';
import { cn, deterministicColor, getInitials } from '../../lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

function Avatar({ name, src, size = 'md', className, ...props }: AvatarProps) {
  const [error, setError] = React.useState(false);
  const showFallback = !src || error;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full overflow-hidden bg-surface-elevated ring-1 ring-border',
        sizeClasses[size],
        className
      )}
      style={showFallback ? { backgroundColor: deterministicColor(name) } : undefined}
      aria-label={name}
      {...props}
    >
      {showFallback ? (
        <span className="font-medium text-white">{getInitials(name)}</span>
      ) : (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      )}
    </span>
  );
}

export { Avatar };
