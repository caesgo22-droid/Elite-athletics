import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary Component
 * 
 * Catches React errors in child components and displays a fallback UI
 * instead of crashing the entire application.
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
    state: State = {
        hasError: false,
        error: null
    };

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console
        console.error('[ERROR BOUNDARY] Component error caught:', error, errorInfo);

        // Call optional error handler
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Future: Send to error tracking service
        // if (window.Sentry) {
        //   window.Sentry.captureException(error, {
        //     extra: errorInfo
        //   });
        // }
    }

    private handleReset = () => {
        this.setState({
            hasError: false,
            error: null
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-6">
                    <div className="glass-card p-8 rounded-2xl max-w-md border border-danger/20">
                        {/* Error Icon */}
                        <div className="flex items-center justify-center mb-6">
                            <div className="size-16 rounded-full bg-danger/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-danger text-4xl">error</span>
                            </div>
                        </div>

                        {/* Error Message */}
                        <h2 className="text-white font-black text-xl mb-2 text-center uppercase">
                            Algo salió mal
                        </h2>
                        <p className="text-slate-400 text-sm mb-6 text-center">
                            Ha ocurrido un error inesperado. Por favor, recarga la página o intenta de nuevo.
                        </p>

                        {/* Error Details (dev only) */}
                        {import.meta.env.DEV && this.state.error && (
                            <div className="bg-black/40 p-4 rounded-lg mb-6 border border-white/5">
                                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2">
                                    Error Details (Dev Only)
                                </p>
                                <p className="text-xs text-danger font-mono">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={this.handleReset}
                                className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-lg transition-all border border-white/10"
                            >
                                Reintentar
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-primary hover:bg-primary/90 text-black font-bold py-3 rounded-lg transition-all"
                            >
                                Recargar App
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
