import * as React from 'react';

export type SettingsTab = 'about' | 'sources' | 'senders' | 'profiles';

interface SettingsState {
  open: boolean;
  activeTab: SettingsTab;
}

let listeners: Array<(state: SettingsState) => void> = [];
let state: SettingsState = { open: false, activeTab: 'about' };

function emit() {
  listeners.forEach((listener) => listener(state));
}

export function openSettings(tab: SettingsTab = 'about') {
  state = { open: true, activeTab: tab };
  emit();
}

export function setSettingsOpen(open: boolean) {
  state = { ...state, open };
  emit();
}

export function setSettingsTab(activeTab: SettingsTab) {
  state = { ...state, activeTab };
  emit();
}

export function useSettingsStore() {
  const [current, setCurrent] = React.useState<SettingsState>(state);

  React.useEffect(() => {
    listeners.push(setCurrent);
    return () => {
      listeners = listeners.filter((l) => l !== setCurrent);
    };
  }, []);

  return current;
}
