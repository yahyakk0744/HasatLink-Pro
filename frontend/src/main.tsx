import React, { Component, type ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { NotificationProvider } from './contexts/NotificationContext.tsx'
import { MessageProvider } from './contexts/MessageContext.tsx'
import './index.css'
import './i18n/config'
import { initGA } from './utils/analytics'

initGA();

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui', color: '#1A1A1A' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Bir hata oluştu</h1>
          <p style={{ color: '#6B6560', marginBottom: '1rem' }}>Lütfen sayfayı yenileyin.</p>
          <button onClick={() => window.location.reload()} style={{ padding: '0.75rem 2rem', background: '#2D6A4F', color: 'white', border: 'none', borderRadius: '9999px', cursor: 'pointer', fontWeight: 600 }}>
            Yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
              <MessageProvider>
                <App />
              </MessageProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    borderRadius: '1rem',
                    background: 'var(--bg-invert)',
                    color: 'var(--text-on-invert)',
                    fontSize: '14px',
                  },
                }}
              />
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
