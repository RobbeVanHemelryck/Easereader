import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SearchPage } from './SearchPage';
import type { SearchParams } from '../../lib/sourcePreferences';

vi.mock('../../hooks/useBookSources', async () => {
  const React = await import('react');
  return {
    useBookSources: () => {
      const [strategy, setStrategy] = React.useState<'zlibrary' | 'source'>('zlibrary');
      return {
        options: {
          zlibrary: [{ label: 'zlib.bz', url: 'https://zlib.bz' }],
          AnnasArchive: [{ label: 'annas-archive.gl', url: 'https://annas-archive.gl' }],
        },
        isLoading: false,
        preferences: { strategy, zlibraryUrl: 'https://zlib.bz', sourceUrl: 'https://annas-archive.gl' },
        setStrategy,
      };
    },
  };
});
vi.mock('../../api/queries/profiles', () => ({ useProfiles: () => ({ data: [] }) }));
vi.mock('../../hooks/useDownload', () => ({ useDownload: () => ({ download: vi.fn() }) }));
vi.mock('../progress/DownloadProgress', () => ({ DownloadProgress: () => null }));
vi.mock('./SearchResults', () => ({
  SearchResults: ({ params }: { params: SearchParams }) => (
    <div data-testid="results-state">{params.q} | {params.strategy}</div>
  ),
}));

describe('SearchPage', () => {
  it('keeps search and source changes in the page without changing the URL', () => {
    const originalUrl = window.location.href;
    const push = vi.spyOn(window.history, 'pushState');
    const replace = vi.spyOn(window.history, 'replaceState');
    render(<SearchPage />);

    const buttons = screen.getByRole('group', { name: 'Book source' }).querySelectorAll('button');
    expect(buttons[0]).toHaveTextContent('Z-Library');
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Pride and Prejudice' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(screen.getByTestId('results-state')).toHaveTextContent('Pride and Prejudice | zlibrary');

    fireEvent.click(screen.getByRole('button', { name: "Anna's Archive" }));
    expect(screen.getByTestId('results-state')).toHaveTextContent('Pride and Prejudice | source');
    expect(window.location.href).toBe(originalUrl);
    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    push.mockRestore();
    replace.mockRestore();
  });
});
