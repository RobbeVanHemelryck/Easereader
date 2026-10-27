import * as React from 'react';
import type { Toast, ToastVariant } from '../components/ui/Toast';

let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function emit() {
  toastListeners.forEach((listener) => listener(toasts));
}

export function addToast(toast: Omit<Toast, 'id'>) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  toasts = [...toasts, { ...toast, id }];
  emit();
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function useToastStore() {
  const [state, setState] = React.useState<Toast[]>(toasts);

  React.useEffect(() => {
    toastListeners.push(setState);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setState);
    };
  }, []);

  return state;
}

export function useToast() {
  return React.useMemo(
    () => ({
      toast: (options: { title: string; description?: string; variant?: ToastVariant }) => {
        addToast(options);
      },
      success: (title: string, description?: string) => addToast({ title, description, variant: 'success' }),
      error: (title: string, description?: string) => addToast({ title, description, variant: 'error' }),
      info: (title: string, description?: string) => addToast({ title, description, variant: 'info' }),
      warning: (title: string, description?: string) => addToast({ title, description, variant: 'warning' }),
      dismiss: dismissToast,
    }),
    []
  );
}
