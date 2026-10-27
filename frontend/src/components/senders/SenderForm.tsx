import * as React from 'react';
import type { components } from '../../api/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SENDER_PRESETS } from '../../lib/senderPresets';

export type SenderFormData = {
  user: string;
  host: string;
  port: number;
  secure: boolean;
  password: string;
};

interface SenderFormProps {
  initial?: components['schemas']['Sender'];
  onSubmit: (data: SenderFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SenderForm({ initial, onSubmit, onCancel, isLoading }: SenderFormProps) {
  const [data, setData] = React.useState<SenderFormData>({
    user: initial?.user ?? '',
    host: initial?.host ?? '',
    port: initial?.port ?? 587,
    secure: initial?.secure ?? false,
    password: '',
  });

  const applyPreset = (preset: (typeof SENDER_PRESETS)[number]) => {
    setData((prev) => ({ ...prev, host: preset.host, port: preset.port, secure: preset.secure }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SENDER_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyPreset(preset)}
          >
            {preset.label}
          </Button>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => applyPreset({ label: 'Custom', host: '', port: 587, secure: false })}>
          Custom
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="sender-user" className="text-xs text-text-secondary">Email address</label>
          <Input
            id="sender-user"
            type="email"
            value={data.user}
            onChange={(e) => setData((prev) => ({ ...prev, user: e.target.value }))}
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="sender-host" className="text-xs text-text-secondary">SMTP host</label>
          <Input
            id="sender-host"
            value={data.host}
            onChange={(e) => setData((prev) => ({ ...prev, host: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="sender-port" className="text-xs text-text-secondary">Port</label>
          <Input
            id="sender-port"
            type="number"
            value={data.port}
            onChange={(e) => setData((prev) => ({ ...prev, port: parseInt(e.target.value, 10) || 0 }))}
            required
          />
        </div>
        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={data.secure}
              onChange={(e) => setData((prev) => ({ ...prev, secure: e.target.checked }))}
              className="h-4 w-4 rounded border-border bg-surface text-primary focus-visible:ring-2 focus-visible:ring-primary"
            />
            Use SSL/TLS
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="sender-password" className="text-xs text-text-secondary">
          {initial ? 'Password (leave blank to keep current)' : 'Password'}
        </label>
        <Input
          id="sender-password"
          type="password"
          value={data.password}
          onChange={(e) => setData((prev) => ({ ...prev, password: e.target.value }))}
          required={!initial}
          autoComplete={initial ? 'off' : 'new-password'}
        />
      </div>

      <p className="text-xs text-text-muted">
        Google accounts commonly require an app password instead of your regular password.
      </p>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={isLoading}>{initial ? 'Update sender' : 'Add sender'}</Button>
      </div>
    </form>
  );
}
