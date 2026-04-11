import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { NotificationProvider } from './contexts/NotificationContext.tsx'
import { MessageProvider } from './contexts/MessageContext.tsx'
import { SocketProvider } from './contexts/SocketContext.tsx'
import { LocationProvider } from './contexts/LocationContext.tsx'
import { initSentry } from './config/sentry.ts'
import './utils/pwaInstallManager'
import './index.css'
import './i18n/config'
import { initGA } from './utils/analytics'
import { shouldLoadAnalytics, setupStatusBar, setupKeyboard, isNative } from './utils/native'

// Native platform setup
if (isNative) {
  setupStatusBar();
  setupKeyboard();
}

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}

// Defer heavy third-party SDKs until after app is interactive
// This prevents Sentry & GA from blocking the initial render
window.addEventListener('load', () => {
  // Small timeout so the app paints first
  setTimeout(() => {
    initSentry()
    if (shouldLoadAnalytics()) {
      initGA()
    }
  }, 1000)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
            <LocationProvider>
            <NotificationProvider>
              <MessageProvider>
                <App />
              </MessageProvider>
              <Toaster
                position="top-right"
                containerStyle={{ zIndex: 9999 }}
                toastOptions={{
                  duration: 3000,
                  style: {
                    borderRadius: '1rem',
                    background: 'var(--bg-invert)',
                    color: 'var(--text-on-invert)',
                    fontSize: '14px',
                    zIndex: 9999,
                  },
                }}
              />
            </NotificationProvider>
            </LocationProvider>
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
