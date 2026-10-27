import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from './components/layout/AppShell';
import { SearchPage } from './components/search/SearchPage';
import './index.css';

// Remove search state left in bookmarks or tabs by earlier versions.
const currentUrl = new URL(window.location.href);
const legacyParams = ['q', 'strategy', 'zlibraryUrl', 'sourceUrl'];
if (legacyParams.some((key) => currentUrl.searchParams.has(key))) {
  legacyParams.forEach((key) => currentUrl.searchParams.delete(key));
  window.history.replaceState(window.history.state, '', currentUrl);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AppShell>
          <SearchPage />
        </AppShell>
      </QueryClientProvider>
    </StrictMode>
  );
}
