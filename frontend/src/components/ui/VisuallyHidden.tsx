import * as React from 'react';
import { cn } from '../../lib/utils';

type VisuallyHiddenProps = React.HTMLAttributes<HTMLSpanElement>;

function VisuallyHidden({ children, ...props }: VisuallyHiddenProps) {
  return (
    <span
      className={cn(
        'absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0',
        '[clip:rect(0,0,0,0)]'
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { VisuallyHidden };
