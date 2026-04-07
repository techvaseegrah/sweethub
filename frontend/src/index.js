import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// --- MODIFIED: Global ResizeObserver Error Suppression ---
// ResizeObserver loop completed with undelivered notifications error is harmless but triggers dev overlays.
window.addEventListener('error', (e) => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
    e.message === 'ResizeObserver loop limit exceeded') {
    const resizeObserverErrGuid = 'window.onerror.resize_observer_error_ignored';
    if (!window[resizeObserverErrGuid]) {
      window[resizeObserverErrGuid] = true;
      e.stopImmediatePropagation();
    }
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);