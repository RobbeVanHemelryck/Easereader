import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-1.5 rounded-md text-[13px] font-normal transition-colors duration-150 focus-visible:ring-[1.5px] focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary/90 text-white hover:bg-primary',
        secondary: 'bg-surface-elevated text-text-secondary border border-border hover:bg-surface-hover hover:text-text-primary',
        destructive: 'bg-destructive/90 text-white hover:bg-destructive',
        ghost: 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
        link: 'text-primary hover:underline',
      },
      size: {
        default: 'h-8 px-3',
        sm: 'h-7 px-2 text-xs',
        xs: 'h-6 px-1.5 text-[11px]',
        lg: 'h-9 px-4',
        icon: 'h-8 w-8',
        'icon-sm': 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, ...props }, ref) => {
    if (asChild) {
      // Slot requires exactly one element child — never append the spinner here.
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {children}
        {isLoading && (
          <span className="ml-1 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
