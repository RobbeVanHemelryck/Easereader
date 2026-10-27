import * as React from 'react';

export type Theme = 'dark' | 'light';
export const THEME_STORAGE_KEY = 'easereader.theme';
const THEME_CHANGE_EVENT = 'easereader:theme-changed';

function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The theme still works for this page if storage is unavailable.
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function subscribeTheme(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.storageArea === localStorage && (event.key === THEME_STORAGE_KEY || event.key === null)) {
      document.documentElement.dataset.theme = event.newValue === 'dark' ? 'dark' : 'light';
      onChange();
    }
  };
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function useTheme(): Theme {
  return React.useSyncExternalStore(subscribeTheme, getTheme);
}
