import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] Unhandled error:', error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: '#e2e8f0',
          backgroundColor: '#0f172a',
          fontFamily: 'system-ui, sans-serif',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Valami hiba történt</h1>
          <p style={{ color: '#94a3b8', maxWidth: '400px' }}>
            A játék váratlan hibába futott. Kattints az újrakezdésre.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: '#22c55e',
              color: '#0f172a',
              fontWeight: 600,
            }}
          >
            Újrakezdés
          </button>
          {this.state.error && (
            <pre style={{
              color: '#64748b',
              fontSize: '0.75rem',
              maxWidth: '600px',
              overflow: 'auto',
              marginTop: '1rem',
            }}>
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
