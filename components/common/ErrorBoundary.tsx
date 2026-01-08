import React from 'react';
import * as Sentry from "@sentry/react";

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const ErrorBoundary: React.FC<Props> = ({ children, fallback }) => {
    return (
        <Sentry.ErrorBoundary
            fallback={({ error, resetError }: { error: any, resetError: () => void }) => (
                <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-zinc-900 rounded-xl border border-zinc-800">
                    <h2 className="text-xl font-bold text-red-500 mb-4">Algo salió mal</h2>
                    <p className="text-zinc-400 mb-6 font-mono text-sm max-w-md break-words">
                        {error?.message || "Error desconocido"}
                    </p>
                    <button
                        onClick={resetError}
                        className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors"
                    >
                        Reintentar
                    </button>
                    <p className="mt-8 text-xs text-zinc-600">
                        Error ID reported to HQ.
                    </p>
                </div>
            )}
        >
            {children}
        </Sentry.ErrorBoundary>
    );
};
