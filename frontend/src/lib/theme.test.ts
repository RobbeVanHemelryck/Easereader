import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setTheme, THEME_STORAGE_KEY, useTheme } from './theme';

describe('appearance preference', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = 'dark';
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('updates all consumers and stores the chosen theme', () => {
    const first = renderHook(() => useTheme());
    const second = renderHook(() => useTheme());
    expect(first.result.current).toBe('dark');

    act(() => setTheme('light'));
    expect(first.result.current).toBe('light');
    expect(second.result.current).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

    act(() => setTheme('dark'));
    expect(first.result.current).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('reflects a theme change in another tab', () => {
    const current = renderHook(() => useTheme());
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: THEME_STORAGE_KEY,
        newValue: 'light',
        storageArea: localStorage,
      }));
    });
    expect(current.result.current).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
