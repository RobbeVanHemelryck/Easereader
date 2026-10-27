import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SenderForm, type SenderFormData } from './SenderForm';

describe('SenderForm', () => {
  it('fills fields from Google preset', () => {
    const onSubmit = vi.fn();
    render(
      <SenderForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Google'));
    expect(screen.getByLabelText('SMTP host')).toHaveValue('smtp.gmail.com');
  });

  it('submits with required values', () => {
    const onSubmit = vi.fn();
    render(
      <SenderForm
        onSubmit={(data: SenderFormData) => {
          onSubmit(data);
        }}
        onCancel={vi.fn()}
      />
    );

    fireEvent.input(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } });
    fireEvent.input(screen.getByLabelText('SMTP host'), { target: { value: 'smtp.example.com' } });
    fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByText('Add sender'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        user: 'test@example.com',
        host: 'smtp.example.com',
        password: 'secret',
      })
    );
  });
});
