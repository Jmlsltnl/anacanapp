import { Component, ErrorInfo, ReactNode } from 'react';
import { reportComponentCrash } from '@/lib/crashReporter';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    reportComponentCrash(error, errorInfo.componentStack || undefined);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background text-foreground">
          <p className="text-lg font-semibold mb-2">Xəta baş verdi</p>
          <p className="text-sm text-muted-foreground text-center mb-4">
            {this.state.error?.message || 'Naməlum xəta'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
          >
            Yenidən cəhd et
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
