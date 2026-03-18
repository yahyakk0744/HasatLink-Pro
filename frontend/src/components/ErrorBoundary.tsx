import { Component, type ErrorInfo, type ReactNode } from 'react'
import * as Sentry from '@sentry/react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)

    // Log to Sentry if available
    try {
      Sentry.captureException(error, {
        contexts: {
          react: { componentStack: errorInfo.componentStack ?? '' },
        },
      })
    } catch {
      // Sentry not initialized — ignore
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-primary)] px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Bir Hata Oluştu
          </h1>

          <p className="text-[var(--text-secondary)] max-w-md mb-8 leading-relaxed">
            Beklenmeyen bir sorunla karşılaştık. Lütfen tekrar deneyin veya sayfayı yenileyin.
          </p>

          {import.meta.env.DEV && this.state.error && (
            <pre className="text-left text-xs bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 p-4 rounded-xl mb-6 max-w-lg w-full overflow-auto max-h-40 border border-red-200 dark:border-red-800">
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}

          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-full font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Tekrar Dene
            </button>

            <button
              onClick={this.handleReload}
              className="px-6 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-full font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
