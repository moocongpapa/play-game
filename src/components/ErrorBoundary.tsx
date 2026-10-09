import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { CookieHouseIcon } from './CookieHouseIcon';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center max-w-md mx-auto select-none">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-rose-100 border-3 border-rose-300 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl mb-4 animate-bounce shadow-md">
            🧸
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#4A3E3D] mb-2 break-keep">
            {this.props.fallbackTitle || '앗! 놀이터에서 친구들이 잠시 쉬고 있어요!'}
          </h2>

          <p className="text-xs sm:text-sm font-bold text-[#8C7B79] mb-6 leading-relaxed break-keep">
            화면이 멈추었을 땐 아래 버튼을 누르면 귀여운 친구들이 다시 반갑게 맞아줄 거예요!
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full">
            <button
              onClick={this.handleReset}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm rounded-2xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <RefreshCw className="w-4 h-4" /> 다시 시작하기
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = window.location.pathname;
              }}
              className="flex-1 py-3 px-4 bg-white hover:bg-slate-50 text-[#4A3E3D] font-black text-sm rounded-2xl border-2 border-slate-200 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <CookieHouseIcon className="size-8" /> 첫 화면으로
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
