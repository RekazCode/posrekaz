import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { useLocaleStore } from '../stores';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and display React errors gracefully.
 * Prevents blank screens when component errors occur.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // We can't use hooks in class components, so we'll use a wrapper component
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

// Functional component wrapper to use hooks
function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const { t } = useLocaleStore();

  return (
    <div className="error-boundary" style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>⚠️</div>
        <h2 style={styles.title}>{t('error.error_occurred', 'Something went wrong')}</h2>
        <p style={styles.message}>
          {error?.message || t('error.unexpected_error', 'An unexpected error occurred')}
        </p>
        <button
          onClick={onReset}
          className="btn btn-primary"
          style={styles.button}
        >
          {t('error.try_again', 'Try Again')}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '1rem',
    backgroundColor: '#f9fafb',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '2rem',
    textAlign: 'center',
    maxWidth: '24rem',
    width: '100%',
  },
  icon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '0.5rem',
  },
  message: {
    color: '#6b7280',
    marginBottom: '1.5rem',
  },
  button: {
    width: '100%',
  },
};

export default ErrorBoundary;
