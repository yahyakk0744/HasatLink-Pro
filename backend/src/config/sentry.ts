import * as Sentry from '@sentry/node';

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log('[Sentry] SENTRY_DSN not set, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    tracesSampleRate: 0.3,
    environment: process.env.NODE_ENV || 'development',
  });

  console.log(`[Sentry] Initialized (env: ${process.env.NODE_ENV || 'development'})`);
}

export { Sentry };
