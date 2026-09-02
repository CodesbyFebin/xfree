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
