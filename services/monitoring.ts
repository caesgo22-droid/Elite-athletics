import * as Sentry from "@sentry/react";

export const initMonitoring = () => {
    if (import.meta.env.VITE_SENTRY_DSN) {
        Sentry.init({
            dsn: import.meta.env.VITE_SENTRY_DSN,
            environment: import.meta.env.MODE,
            integrations: [
                Sentry.browserTracingIntegration(),
                Sentry.replayIntegration(),
            ],
            // Performance Monitoring
            tracesSampleRate: 1.0,
            // Session Replay
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
        });
        console.log("[Monitoring] Sentry Initialized");
    } else {
        console.warn("[Monitoring] Sentry DSN not found. Monitoring disabled.");
    }
};

export const logError = (error: Error, context?: any) => {
    console.error(error);
    Sentry.captureException(error, { extra: context });
};
