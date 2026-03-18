import * as Sentry from '@sentry/react'

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined

  if (!dsn) {
    if (import.meta.env.DEV) {
      console.info('[Sentry] DSN not set — skipping initialization')
    }
    return
  }

  const isProd = import.meta.env.PROD

  Sentry.init({
    dsn,
    environment: isProd ? 'production' : 'development',
    release: `hasatlink-frontend@${__APP_VERSION__}`,

    // Performance monitoring
    tracesSampleRate: isProd ? 0.2 : 1.0,

    // Session replay disabled — too heavy for production
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    // Only send errors in production, log everything in dev
    beforeSend(event) {
      if (!isProd) {
        console.debug('[Sentry] Event captured:', event)
      }
      return event
    },

    // Filter noisy errors
    ignoreErrors: [
      'ResizeObserver loop',
      'Network Error',
      'Load failed',
      'ChunkLoadError',
      'Loading chunk',
    ],
  })
}

// Re-export Sentry for use in other files
export { Sentry }

// Global type for the injected version
declare const __APP_VERSION__: string
