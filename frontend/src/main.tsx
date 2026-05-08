import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Localtunnel bypass: add header so API calls skip the IP verification page
const _apiUrl = import.meta.env.VITE_API_URL || '';
if (_apiUrl.includes('loca.lt')) {
  const _origFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    if (url.startsWith(_apiUrl)) {
      init = { ...init, headers: { 'Bypass-Tunnel-Reminder': 'true', ...(init?.headers as Record<string,string> || {}) } };
    }
    return _origFetch(input, init);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
