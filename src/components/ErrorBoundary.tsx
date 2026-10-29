import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onResetFilters?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleResetFilters = () => {
    try {
      if (this.props.onResetFilters) {
        this.props.onResetFilters();
      }
      // Clear persisted race filter in localStorage
      const raw = localStorage.getItem('bevg.settings.v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.raceFilter = [];
        localStorage.setItem('bevg.settings.v1', JSON.stringify(parsed));
      }
    } catch (e) {
      console.error('Error in handleResetFilters:', e);
    }
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 bg-stone-50 border border-stone-200 rounded-2xl text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-stone-900">
            {this.props.fallbackTitle || 'Something went wrong displaying this section'}
          </h3>
          <p className="text-xs text-stone-600 max-w-md mx-auto">
            Something went wrong displaying this section - Reset filters / Reload
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={this.handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset filters
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
