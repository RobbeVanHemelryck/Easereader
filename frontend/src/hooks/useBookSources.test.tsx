import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBookSources } from './useBookSources';
import { STORAGE_KEY } from '../lib/sourcePreferences';

vi.mock('../api/queries/bookSources', () => ({
  useBookSources: () => ({
    data: options,
    isLoading: false,
    error: null,
  }),
}));

const options = {
  zlibrary: [
    { label: 'articles.sk', url: 'https://articles.sk' },
    { label: 'zlib.bz', url: 'https://zlib.bz' },
    { label: 'z-library.website', url: 'https://z-library.website' },
  ],
  AnnasArchive: [
    { label: 'annas-archive.gl', url: 'https://annas-archive.gl' },
    { label: 'annas-archive.pk', url: 'https://annas-archive.pk' },
  ],
};

describe('shared book source preferences', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('updates search and settings immediately and preserves the choice on remount', () => {
    const search = renderHook(() => useBookSources());
    const settings = renderHook(() => useBookSources());

    act(() => settings.result.current.setZlibraryUrl('https://zlib.bz'));
    act(() => settings.result.current.setStrategy('zlibrary'));
    expect(search.result.current.preferences).toEqual(settings.result.current.preferences);
    expect(search.result.current.preferences?.zlibraryUrl).toBe('https://zlib.bz');
    expect(search.result.current.preferences?.strategy).toBe('zlibrary');

    act(() => search.result.current.setStrategy('source'));
    expect(settings.result.current.preferences?.strategy).toBe('source');
    act(() => settings.result.current.setSourceUrl('https://annas-archive.pk'));
    expect(search.result.current.preferences?.sourceUrl).toBe('https://annas-archive.pk');

    const expected = search.result.current.preferences;
    search.unmount();
    settings.unmount();
    expect(renderHook(() => useBookSources()).result.current.preferences).toEqual(expected);
  });

  it('refreshes mounted consumers when another tab changes or clears preferences', () => {
    const search = renderHook(() => useBookSources());
    const next = {
      strategy: 'zlibrary',
      zlibraryUrl: 'https://z-library.website',
      sourceUrl: 'https://annas-archive.gl',
    };
    act(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, storageArea: localStorage }));
    });
    expect(search.result.current.preferences).toEqual(next);

    act(() => {
      localStorage.clear();
      window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }));
    });
    expect(search.result.current.preferences?.strategy).toBe('source');
    expect(search.result.current.preferences?.zlibraryUrl).toBe('https://articles.sk');
  });
});
