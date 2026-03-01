'use client'

import React from 'react'
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

const LOG_PREFIX = '[VibrationFit Error Boundary]'

interface ErrorBoundaryWithReportProps {
  children: React.ReactNode
  /** Optional label for where this boundary is (e.g. "Profile Edit") */
  label?: string
}

interface State {
  error: Error | null
  componentStack: string | null
  showDetails: boolean
}

export class ErrorBoundaryWithReport extends React.Component<ErrorBoundaryWithReportProps, State> {
  constructor(props: ErrorBoundaryWithReportProps) {
    super(props)
    this.state = {
      error: null,
      componentStack: null,
      showDetails: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ componentStack: errorInfo.componentStack ?? null })
    console.error(LOG_PREFIX, 'Caught error:', error.message, '\n', error.stack)
    if (errorInfo.componentStack) {
      console.error(LOG_PREFIX, 'Component stack:', errorInfo.componentStack)
    }
  }

  handleRetry = () => {
    this.setState({ error: null, componentStack: null, showDetails: false })
  }

  render() {
    if (this.state.error) {
      const { error, componentStack, showDetails } = this.state
      const label = this.props.label ? ` (${this.props.label})` : ''
      return (
        <div
          className="min-h-[200px] rounded-2xl border-2 border-red-500/40 bg-red-500/10 p-6 text-left"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-400 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-red-200">
                Something went wrong{label}
              </h2>
              <p className="mt-1 text-sm text-neutral-300">
                The page hit an error. Use the details below to debug, or refresh to try again.
              </p>
              <button
                type="button"
                onClick={this.handleRetry}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-200 border border-red-500/40 hover:bg-red-500/30 text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
              <button
                type="button"
                onClick={() => this.setState({ showDetails: !showDetails })}
                className="mt-4 ml-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-700 text-neutral-300 hover:bg-neutral-600 text-sm font-medium transition-colors"
              >
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showDetails ? 'Hide' : 'Show'} technical details
              </button>
              {showDetails && (
                <div className="mt-4 p-4 rounded-lg bg-black/40 border border-neutral-700 font-mono text-xs text-neutral-400 overflow-auto max-h-[280px]">
                  <div className="text-red-300 font-semibold mb-2">Error: {error.message}</div>
                  {error.stack && (
                    <pre className="whitespace-pre-wrap break-words mb-3">{error.stack}</pre>
                  )}
                  {componentStack && (
                    <>
                      <div className="text-neutral-500 font-semibold mb-1">Component stack:</div>
                      <pre className="whitespace-pre-wrap break-words">{componentStack}</pre>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
