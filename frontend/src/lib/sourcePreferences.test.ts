import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDefaultPreferences,
  loadSourcePreferences,
  validateAndNormalizePreferences,
  resolveSourcePreferences,
  saveSourcePreferences,
  STORAGE_KEY,
  type BookSourceOptions,
} from './sourcePreferences';

const sampleOptions: BookSourceOptions = {
  zlibrary: [
    { label: 'zlib.bz', url: 'https://zlib.bz' },
    { label: 'articles.sk', url: 'https://articles.sk' },
    { label: '1lib.sk', url: 'https://1lib.sk' },
  ],
  AnnasArchive: [
    { label: 'annas-archive.gl', url: 'https://annas-archive.gl' },
    { label: 'annas-archive.pk', url: 'https://annas-archive.pk' },
  ],
};

describe('sourcePreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default preferences from options', () => {
    const prefs = getDefaultPreferences(sampleOptions);
    expect(prefs.strategy).toBe('source');
    expect(prefs.zlibraryUrl).toBe('https://zlib.bz');
    expect(prefs.sourceUrl).toBe('https://annas-archive.gl');
  });

  it('loads saved preferences', () => {
    const saved = {
      strategy: 'source' as const,
      zlibraryUrl: 'https://zlib.bz',
      sourceUrl: 'https://annas-archive.pk',
    };
    saveSourcePreferences(saved);
    expect(loadSourcePreferences()).toEqual(saved);
  });

  it('preserves the selected source and domains from the original app', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      strategy: 'source',
      zlibraryUrl: 'https://1lib.sk',
      sourceUrl: 'https://annas-archive.pk',
    }));
    expect(loadSourcePreferences()).toEqual({
      strategy: 'source',
      zlibraryUrl: 'https://1lib.sk',
      sourceUrl: 'https://annas-archive.pk',
    });
    const migrated = resolveSourcePreferences(sampleOptions);
    expect(migrated).toEqual(loadSourcePreferences());
    saveSourcePreferences(migrated);
    expect(loadSourcePreferences()).toEqual(migrated);
  });

  it('preserves an explicitly selected Z-Library domain during migration', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      strategy: 'zlibrary',
      zlibraryUrl: 'https://articles.sk',
      sourceUrl: 'https://annas-archive.gl',
    }));
    expect(resolveSourcePreferences(sampleOptions)).toEqual({
      strategy: 'zlibrary',
      zlibraryUrl: 'https://articles.sk',
      sourceUrl: 'https://annas-archive.gl',
    });
  });

  it('preserves a partial older preference and fills in missing domains', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ strategy: 'source' }));
    expect(resolveSourcePreferences(sampleOptions)).toEqual({
      strategy: 'source',
      zlibraryUrl: 'https://zlib.bz',
      sourceUrl: 'https://annas-archive.gl',
    });
  });

  it('falls back when saved URL is no longer allowed', () => {
    const saved = {
      strategy: 'source' as const,
      zlibraryUrl: 'https://old.sk',
      sourceUrl: 'https://annas-archive.gl',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    const resolved = resolveSourcePreferences(sampleOptions);
    expect(resolved.zlibraryUrl).toBe('https://zlib.bz');
    expect(resolved.sourceUrl).toBe('https://annas-archive.gl');
  });

  it('validates and normalizes preferences', () => {
    const prefs = {
      strategy: 'zlibrary' as const,
      zlibraryUrl: 'https://unknown.sk',
      sourceUrl: 'https://annas-archive.pk',
    };
    const normalized = validateAndNormalizePreferences(prefs, sampleOptions);
    expect(normalized.zlibraryUrl).toBe('https://zlib.bz');
    expect(normalized.sourceUrl).toBe('https://annas-archive.pk');
  });
});
