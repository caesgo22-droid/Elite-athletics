/**
 * Logger Service - Centralized logging with production safety
 * 
 * Replaces console.log statements throughout the app with a controlled
 * logging mechanism that can be disabled in production and integrated
 * with error tracking services.
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info';

interface LogEntry {
    level: LogLevel;
    message: string;
    data?: any;
    timestamp: number;
}

class LoggerService {
    private isDev = import.meta.env.DEV;
    private logs: LogEntry[] = [];
    private maxLogs = 100; // Keep last 100 logs in memory

    /**
     * Standard log - only shown in development
     */
    log(message: string, data?: any): void {
        if (this.isDev) {
            console.log(message, data);
        }
        this.addLog('log', message, data);
    }

    /**
     * Warning - shown in development
     */
    warn(message: string, data?: any): void {
        if (this.isDev) {
            console.warn(message, data);
        }
        this.addLog('warn', message, data);
    }

    /**
     * Error - always shown and can be sent to error tracking
     */
    error(message: string, error?: any): void {
        console.error(message, error);
        this.addLog('error', message, error);

        // Future: Send to error tracking service (Sentry, LogRocket, etc.)
        // this.sendToErrorTracking(message, error);
    }

    /**
     * Info - shown in development
     */
    info(message: string, data?: any): void {
        if (this.isDev) {
            console.info(message, data);
        }
        this.addLog('info', message, data);
    }

    /**
     * Get recent logs (dev only)
     */
    getLogs(): LogEntry[] {
        return this.isDev ? this.logs : [];
    }

    /**
     * Clear logs
     */
    clearLogs(): void {
        this.logs = [];
    }

    /**
     * Add log entry to memory
     */
    private addLog(level: LogLevel, message: string, data?: any): void {
        this.logs.push({
            level,
            message,
            data,
            timestamp: Date.now()
        });

        // Keep only last N logs to prevent memory issues
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
    }

    /**
     * Future: Send errors to tracking service
     */
    private sendToErrorTracking(message: string, error: any): void {
        // Implementation for Sentry, LogRocket, etc.
        // Example:
        // if (window.Sentry) {
        //   window.Sentry.captureException(error, { extra: { message } });
        // }
    }
}

// Export singleton instance
export const logger = new LoggerService();
