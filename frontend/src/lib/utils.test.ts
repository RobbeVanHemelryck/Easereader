import { describe, it, expect } from 'vitest';
import { cn, getInitials, deterministicColor } from './utils';

describe('cn', () => {
  it('merges class names and resolves tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-sm', undefined, 'text-lg')).toBe('text-lg');
  });
});

describe('getInitials', () => {
  it('returns initials from a full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('Alice')).toBe('A');
  });

  it('ignores extra whitespace', () => {
    expect(getInitials('  Bob   Marley  ')).toBe('BM');
  });
});

describe('deterministicColor', () => {
  it('returns a consistent color for the same name', () => {
    expect(deterministicColor('test')).toBe(deterministicColor('test'));
  });

  it('returns different colors for different names', () => {
    expect(deterministicColor('a')).not.toBe(deterministicColor('b'));
  });
});
