import React, { Component, ErrorInfo, ReactNode } from 'react';
import { LeafMark } from './Logo';
import { ErrorLoggingService } from '../../services/errorLogging';
import { RefreshCw, ShieldCheck } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorId = `err_${Date.now().toString(36)}`;
    this.setState({ errorId });

    // Safely log sanitized error
    ErrorLoggingService.logError(
      error,
      'react_error_boundary',
      { errorId },
      errorInfo.componentStack || undefined
    );
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#F9FAF7] flex items-center justify-center p-6 text-center font-sans">
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 max-w-md w-full shadow-sm space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-[#E8F2EC] mx-auto flex items-center justify-center shadow-xs">
              <LeafMark size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[#144D3A] tracking-tight">
                Sepertinya ada sedikit kendala.
              </h2>
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#2E7D61] font-medium bg-[#E8F2EC] py-1.5 px-3 rounded-full mx-auto w-fit">
                <ShieldCheck className="w-4 h-4 text-[#2E7D61]" />
                <span>Data keluarga kamu tetap aman.</span>
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed pt-2">
                Jangan khawatir, catatan finansial dan privasi keluargamu tersimpan dengan baik di sistem.
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full bg-[#144D3A] hover:bg-[#0E372A] text-white text-sm font-semibold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Coba Lagi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
