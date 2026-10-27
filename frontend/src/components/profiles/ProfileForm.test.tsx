import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileForm } from './ProfileForm';

describe('ProfileForm', () => {
  const senders = [{ id: '1', type: 'smtp' as const, user: 'sender@example.com', host: 'smtp.example.com', port: 587, secure: false }];

  it('rejects images larger than 5 MiB', async () => {
    render(
      <ProfileForm
        senders={senders}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const file = new File(['x'], 'big.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });

    const input = screen.getByLabelText(/Profile image/i);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Image must be smaller than 5 MiB.')).toBeInTheDocument();
    });
  });
});
