'use client';

import React from 'react';

// ---------------------------------------------------------------------------
// Custom Error Class
// ---------------------------------------------------------------------------

export class DashboardError extends Error {
  readonly category: 'render' | 'data' | 'network' | 'unknown';
  readonly context: Record<string, string | number | boolean>;

  constructor(
    message: string,
    category: DashboardError['category'] = 'unknown',
    context: Record<string, string | number | boolean> = {},
  ) {
    super(message);
    this.name = 'DashboardError';
    this.category = category;
    this.context = context;
  }
}

// ---------------------------------------------------------------------------
// Props Interface
// ---------------------------------------------------------------------------

export interface DashboardErrorBoundaryProps {
  /** Child tree to protect */
  children: React.ReactNode;
  /** Called when a log export is requested from the error screen */
  onExportLogs?: () => void;
}

interface State {
  hasError: boolean;
  /** Sanitized message safe for display in all environments */
  sanitizedMessage: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Application-level catch-all error boundary.
 * Renders a full-page fallback with "Reload" and "Export logs" actions.
 * In production, stack traces and file paths are stripped from the displayed
 * message. In development, full error details are printed to the console only.
 */
export class DashboardErrorBoundary extends React.Component<
  DashboardErrorBoundaryProps,
  State
> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, sanitizedMessage: '' };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static getDerivedStateFromError(_error: Error): State {
    const isDev = process.env.NODE_ENV === 'development';
    const sanitizedMessage = isDev
      ? 'A rendering error occurred. Check the browser console for details.'
      : 'An unexpected error occurred. Please reload the page.';

    return { hasError: true, sanitizedMessage };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Log full details to console — never expose to UI in production
    if (process.env.NODE_ENV === 'development') {
      console.error('[DashboardErrorBoundary] Caught error:', error);
      console.error('[DashboardErrorBoundary] Component stack:', info.componentStack);
    } else {
      // Structured log without PII or stack trace in production
      console.error(
        JSON.stringify({
          level: 'error',
          component: 'DashboardErrorBoundary',
          message: 'Application-level render error',
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }

  private handleReload(): void {
    window.location.reload();
  }

  private handleExportLogs(): void {
    this.props.onExportLogs?.();
  }

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6"
      >
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-white dark:border-red-800 dark:bg-gray-800 p-8 shadow-lg text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-7 w-7 text-red-600 dark:text-red-400"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Something went wrong
          </h1>

          {/* Sanitized message — no stack traces or file paths */}
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            {this.state.sanitizedMessage}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => this.handleReload()}
              className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              Reload page
            </button>
            <button
              type="button"
              onClick={() => this.handleExportLogs()}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            >
              Export logs
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default DashboardErrorBoundary;
