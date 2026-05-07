/**
 * ErrorBoundary — top-level React error boundary.
 *
 * Catches any uncaught render/lifecycle exception inside the
 * subtree and renders a terminal-styled fallback panel so the
 * app never collapses into a blank white screen.
 *
 * @module components/ErrorBoundary
 */

// --- deps ---
import { Component, ErrorInfo, ReactNode } from 'react';

// --- local ---
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  caughtError: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { caughtError: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { caughtError: error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // surface to console so devs can grab the stack from the network/console
    console.error('[error-boundary] uncaught exception:', error, info.componentStack);
  }

  handleRetry = (): void => {
    this.setState({ caughtError: null });
  };

  handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render(): ReactNode {
    const { caughtError } = this.state;

    if (caughtError === null) {
      return this.props.children;
    }

    const message = caughtError.message || 'unknown error';
    const stack = caughtError.stack ?? '';

    return (
      <div className={styles.boundaryShell}>
        <div className={styles.boundaryPanel}>
          <div className={styles.boundaryHeader}>
            <span className={styles.boundaryHeaderDot} />
            <span>cpitracker // runtime fault</span>
          </div>

          <div className={styles.boundaryComment}>
            {`// uncaught exception ${message}`}
          </div>

          {stack ? (
            <pre className={styles.boundaryDetails}>{stack}</pre>
          ) : null}

          <div className={styles.boundaryActions}>
            <button
              type="button"
              className={styles.boundaryRetryBtn}
              onClick={this.handleRetry}
            >
              retry
            </button>
            <button
              type="button"
              className={styles.boundaryReloadBtn}
              onClick={this.handleReload}
            >
              reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
