import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SourceSelector } from './SourceSelector';

describe('SourceSelector', () => {
  const options = {
    zlibrary: [{ label: 'articles.sk', url: 'https://articles.sk' }],
    AnnasArchive: [{ label: 'annas-archive.gl', url: 'https://annas-archive.gl' }],
  };

  it('renders active strategy and domain selectors', () => {
    const onStrategyChange = vi.fn();
    render(
      <SourceSelector
        options={options}
        preferences={{ strategy: 'source', zlibraryUrl: 'https://articles.sk', sourceUrl: 'https://annas-archive.gl' }}
        onStrategyChange={onStrategyChange}
        onZlibraryUrlChange={vi.fn()}
        onSourceUrlChange={vi.fn()}
      />
    );

    expect(screen.getByText("Anna's Archive")).toBeInTheDocument();
    expect(screen.getByLabelText("Z-Library domain")).toBeInTheDocument();
    expect(screen.getByLabelText("Anna's Archive domain")).toBeInTheDocument();
  });

  it('calls onStrategyChange when strategy button clicked', () => {
    const onStrategyChange = vi.fn();
    render(
      <SourceSelector
        options={options}
        preferences={{ strategy: 'source', zlibraryUrl: 'https://articles.sk', sourceUrl: 'https://annas-archive.gl' }}
        onStrategyChange={onStrategyChange}
        onZlibraryUrlChange={vi.fn()}
        onSourceUrlChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Z-Library'));
    expect(onStrategyChange).toHaveBeenCalledWith('zlibrary');
  });
});
