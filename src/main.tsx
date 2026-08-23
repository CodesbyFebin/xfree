import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// The prerender shell gives crawlers meaningful HTML before JavaScript runs.
// Remove it once React starts so hydrated pages contain exactly one visible
// document heading and no duplicate structured content.
document.getElementById('prerender-shell')?.remove();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Local tools and Studio can be reopened offline after the user has visited
// them online at least once. API requests, ads, and third-party model assets
// are deliberately excluded from service-worker caching.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline/PWA support is progressive enhancement; app startup must not fail.
    });
  }, { once: true });
}
