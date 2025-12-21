import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Error logging for debugging
window.addEventListener('error', (event) => {
  console.error('[App Error]', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[React] Root element not found');
} else {
  console.log('[React] Mounting app...');
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  console.log('[React] App mounted successfully');
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('[PWA] Service Worker registered:', registration.scope))
      .catch(err => console.log('[PWA] Service Worker registration failed:', err));
  });
}
