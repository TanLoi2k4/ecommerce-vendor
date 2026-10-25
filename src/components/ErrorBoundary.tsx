import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error boundary:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="card max-w-md w-full p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-error-50 dark:bg-error-950 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-error-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Đã xảy ra lỗi
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {this.state.message ?? 'Đã xảy ra lỗi không mong muốn.'}
            </p>
            <button type="button" onClick={this.handleReset} className="btn btn-primary">
              <RefreshCw className="w-5 h-5" />
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
