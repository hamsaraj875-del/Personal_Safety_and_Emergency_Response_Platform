import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 border border-slate-200 shadow-card text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#EA3B52] mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Dashboard View Recovered</h3>
              <p className="text-xs text-slate-500 mt-1">
                A rendering notice was caught. You can reload this view safely.
              </p>
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-[#EA3B52] hover:bg-[#d92d44] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Render</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
