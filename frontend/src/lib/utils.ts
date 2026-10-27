import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function deterministicColor(name: string): string {
  const colors = [
    'oklch(0.62 0.19 259.8)',
    'oklch(0.58 0.22 27.3)',
    'oklch(0.62 0.17 149.2)',
    'oklch(0.72 0.17 78.6)',
    'oklch(0.65 0.15 230)',
    'oklch(0.55 0.18 300)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
