import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Moon, Sun, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { SourceSelector } from '../search/SourceSelector';
import { SenderForm, type SenderFormData } from '../senders/SenderForm';
import { SenderList } from '../senders/SenderList';
import { ProfileForm, type ProfileFormData } from '../profiles/ProfileForm';
import { ProfileList } from '../profiles/ProfileList';
import { useBookSources } from '../../hooks/useBookSources';
import { useSenders } from '../../api/queries/senders';
import { useProfiles } from '../../api/queries/profiles';
import { useCreateSender } from '../../api/mutations/senderMutations';
import { useCreateProfile } from '../../api/mutations/profileMutations';
import { useToast } from '../../stores/toastStore';
import { cn } from '../../lib/utils';
import { setTheme, useTheme } from '../../lib/theme';

type Tab = 'about' | 'sources' | 'senders' | 'profiles';

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: Tab;
  onActiveTabChange: (tab: Tab) => void;
}

const tabs: { key: Tab; label: string }[] = [
  { key: 'about', label: 'How it works' },
  { key: 'sources', label: 'Book sources' },
  { key: 'senders', label: 'Senders' },
  { key: 'profiles', label: 'Profiles' },
];

export function SettingsDrawer({ open, onOpenChange, activeTab, onActiveTabChange }: SettingsDrawerProps) {
  const toast = useToast();
  const theme = useTheme();
  const { options, preferences, isLoading: sourcesLoading, setStrategy, setZlibraryUrl, setSourceUrl } = useBookSources();
  const { data: senders = [] } = useSenders();
  const { data: profiles = [] } = useProfiles();
  const createSender = useCreateSender();
  const createProfile = useCreateProfile();

  const [showSenderForm, setShowSenderForm] = React.useState(false);
  const [showProfileForm, setShowProfileForm] = React.useState(false);

  const handleCreateSender = async (data: SenderFormData) => {
    try {
      await createSender.mutateAsync(data);
      setShowSenderForm(false);
      toast.success('Sender added');
    } catch (err) {
      toast.error('Failed to add sender', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleCreateProfile = async (data: ProfileFormData) => {
    try {
      await createProfile.mutateAsync(data);
      setShowProfileForm(false);
      toast.success('Profile added');
    } catch (err) {
      toast.error('Failed to add profile', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-[overlay-in_200ms_ease-out] data-[state=closed]:animate-[overlay-out_150ms_ease-in]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-bg outline-none sm:max-w-sm data-[state=open]:animate-[drawer-in_250ms_ease-out] data-[state=closed]:animate-[drawer-out_200ms_ease-in]"
        >
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
            <DialogPrimitive.Title className="text-[13px] font-medium text-text-primary">
              Settings
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2.5">
            <span className="text-xs text-text-secondary">Appearance</span>
            <div className="inline-flex rounded-md border border-border p-0.5" role="group" aria-label="Appearance">
              {([
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'light', label: 'Light', icon: Sun },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={theme === value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors duration-150',
                    theme === value
                      ? 'bg-surface-elevated text-text-primary'
                      : 'text-text-muted hover:text-text-secondary'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="shrink-0 overflow-x-auto border-b border-border px-4 py-2.5">
            <div className="inline-flex rounded-md border border-border p-0.5" role="tablist" aria-label="Settings sections">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => onActiveTabChange(tab.key)}
                  className={cn(
                    'whitespace-nowrap rounded px-2.5 py-1 text-xs transition-colors duration-150',
                    activeTab === tab.key
                      ? 'bg-surface-elevated text-text-primary'
                      : 'text-text-muted hover:text-text-secondary'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {activeTab === 'about' && (
              <div className="space-y-3 text-xs leading-relaxed text-text-secondary">
                <p>
                  Easereader searches Z-Library and Anna's Archive for EPUB ebooks and can send them to your reading device via email.
                </p>
                <ul className="list-disc space-y-1.5 pl-4 marker:text-text-muted">
                  <li>Pick a book source strategy and domain in Book sources.</li>
                  <li>Add an SMTP sender and a device profile in Settings.</li>
                  <li>Search, download directly, or send to a profile.</li>
                  <li>Live download progress appears for Anna's Archive downloads.</li>
                </ul>
              </div>
            )}

            {activeTab === 'sources' && (
              <SourceSelector
                options={options}
                preferences={preferences}
                disabled={sourcesLoading}
                onStrategyChange={setStrategy}
                onZlibraryUrlChange={setZlibraryUrl}
                onSourceUrlChange={setSourceUrl}
              />
            )}

            {activeTab === 'senders' && (
              <div className="space-y-4">
                {showSenderForm ? (
                  <SenderForm
                    onSubmit={(data) => void handleCreateSender(data)}
                    onCancel={() => setShowSenderForm(false)}
                    isLoading={createSender.isPending}
                  />
                ) : (
                  <Button size="sm" onClick={() => setShowSenderForm(true)}>Add sender</Button>
                )}
                <SenderList senders={senders} />
              </div>
            )}

            {activeTab === 'profiles' && (
              <div className="space-y-4">
                {showProfileForm ? (
                  <ProfileForm
                    senders={senders}
                    onSubmit={(data) => void handleCreateProfile(data)}
                    onCancel={() => setShowProfileForm(false)}
                    isLoading={createProfile.isPending}
                  />
                ) : (
                  <Button size="sm" onClick={() => setShowProfileForm(true)} disabled={senders.length === 0}>
                    Add profile
                  </Button>
                )}
                <ProfileList profiles={profiles} senders={senders} />
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
