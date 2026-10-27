import * as React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { Toaster } from '../ui/Toast';
import { useToastStore, dismissToast } from '../../stores/toastStore';
import { useSettingsStore, setSettingsOpen, setSettingsTab, openSettings } from '../../stores/settingsStore';
import { SettingsDrawer } from '../settings/SettingsDrawer';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const toasts = useToastStore();
  const settings = useSettingsStore();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-11 max-w-3xl items-center justify-between px-4">
          <span className="text-[13px] font-medium tracking-tight text-text-primary">
            Easereader
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openSettings()}
            aria-label="Open settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>

      <Toaster toasts={toasts} onDismiss={dismissToast} />
      <SettingsDrawer
        open={settings.open}
        onOpenChange={setSettingsOpen}
        activeTab={settings.activeTab}
        onActiveTabChange={setSettingsTab}
      />
    </div>
  );
}
