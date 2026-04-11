// Sentry is loaded lazily — NOT on the critical path
// This avoids blocking the initial page render with a heavy ~200KB bundle

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined

  if (!dsn) {
    if (import.meta.env.DEV) {
      console.info('[Sentry] DSN not set — skipping initialization')
    }
    return
  }

  const isProd = import.meta.env.PROD

  // Dynamic import: Sentry bundle loads AFTER the app is interactive
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn,
      environment: isProd ? 'production' : 'development',
      release: `hasatlink-frontend@${__APP_VERSION__}`,
      tracesSampleRate: isProd ? 0.2 : 1.0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      beforeSend(event) {
        if (!isProd) {
          console.debug('[Sentry] Event captured:', event)
        }
        return event
      },
      ignoreErrors: [
        'ResizeObserver loop',
        'Network Error',
        'Load failed',
        'ChunkLoadError',
        'Loading chunk',
      ],
    })
  })
}

// Lazy Sentry proxy — returns a no-op if Sentry hasn't loaded yet
export const Sentry = {
  captureException: (err: unknown) => {
    import('@sentry/react').then((s) => s.captureException(err))
  },
  captureMessage: (msg: string) => {
    import('@sentry/react').then((s) => s.captureMessage(msg))
  },
}

// Global type for the injected version
declare const __APP_VERSION__: string
