import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, label, children, id: idProp, ...props }, ref) => {
  const generatedId = React.useId();
  const id = idProp ?? generatedId;

  return (
    <div className="grid gap-1">
      {label && (
        <label className="text-[11px] text-text-muted" htmlFor={id}>
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          'flex h-8 w-full appearance-none rounded-md border border-border bg-transparent px-2.5 text-[13px] text-text-primary transition-colors hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    </div>
  );
});
Select.displayName = 'Select';

export { Select };
