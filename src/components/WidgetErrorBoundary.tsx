'use client';

import React from 'react';

// ---------------------------------------------------------------------------
// Custom Error Class
// ---------------------------------------------------------------------------

export class WidgetError extends Error {
  readonly category: 'render' | 'data' | 'network' | 'unknown';
  readonly context: Record<string, string | number | boolean>;

  constructor(
    message: string,
    category: WidgetError['category'] = 'unknown',
    context: Record<string, string | number | boolean> = {},
  ) {
    super(message);
    this.name = 'WidgetError';
    this.category = category;
    this.context = context;
  }
}

// ---------------------------------------------------------------------------
// Props Interface
// ---------------------------------------------------------------------------

export interface WidgetErrorBoundaryProps {
  /** Logical name of the widget — shown in the error card header */
  widgetName: string;
  /** Child tree to protect */
  children: React.ReactNode;
  /** Maximum number of retry attempts before the retry button is disabled */
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  retryCount: number;
  /** Sanitized error message safe for all environments */
  sanitizedMessage: string;
}

const DEFAULT_MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Per-widget error boundary that isolates failures from the rest of the
 * dashboard. Provides an inline error card with a "Retry" button.
 * Retries are limited to `maxRetries` (default 3). After exhaustion the
 * retry button is disabled and an exhaustion message is shown.
 *
 * Stack traces are only printed to the console. The UI always shows a
 * sanitized message regardless of environment.
 */
export class WidgetErrorBoundary extends React.Component<
  WidgetErrorBoundaryProps,
  State
> {
  static defaultProps = { maxRetries: DEFAULT_MAX_RETRIES };

  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, retryCount: 0, sanitizedMessage: '' };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static getDerivedStateFromError(_error: Error): Partial<State> {
    return {
      hasError: true,
      sanitizedMessage: 'This widget encountered an error.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const { widgetName } = this.props;

    if (process.env.NODE_ENV === 'development') {
      console.error(`[WidgetErrorBoundary:${widgetName}] Caught error:`, error);
      console.error(`[WidgetErrorBoundary:${widgetName}] Stack:`, info.componentStack);
    } else {
      console.error(
        JSON.stringify({
          level: 'error',
          component: 'WidgetErrorBoundary',
          widget: widgetName,
          message: 'Widget render error',
          retryCount: this.state.retryCount,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }

  private handleRetry(): void {
    const maxRetries = this.props.maxRetries ?? DEFAULT_MAX_RETRIES;
    if (this.state.retryCount >= maxRetries) return;

    this.setState((prev) => ({
      hasError: false,
      retryCount: prev.retryCount + 1,
      sanitizedMessage: '',
    }));
  }

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const maxRetries = this.props.maxRetries ?? DEFAULT_MAX_RETRIES;
    const isExhausted = this.state.retryCount >= maxRetries;
    const { widgetName } = this.props;

    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4 w-full"
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="shrink-0 mt-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5 text-red-500 dark:text-red-400"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            {/* Widget name */}
            <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-0.5">
              {widgetName} — Error
            </p>

            {/* Sanitized message */}
            <p className="text-sm text-red-600 dark:text-red-500 mb-3">
              {this.state.sanitizedMessage}
            </p>

            {/* Retry / exhaustion */}
            {isExhausted ? (
              <p className="text-xs text-red-500 dark:text-red-400">
                Maximum retry attempts ({maxRetries}) reached. Please reload the page.
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => this.handleRetry()}
                  className="text-xs font-medium px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  aria-label={`Retry loading ${widgetName}`}
                >
                  Retry
                </button>
                <span className="text-xs text-red-400 dark:text-red-500">
                  Attempt {this.state.retryCount + 1} of {maxRetries}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default WidgetErrorBoundary;
