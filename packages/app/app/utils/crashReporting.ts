import * as Sentry from '@sentry/react-native';

import Config from '@/config';

/**
 * Error classifications used to sort errors on error reporting services.
 */
export enum ErrorType {
    /**
     * An error that would normally cause a red screen in dev
     * and force the user to sign out and restart.
     */
    FATAL = 'Fatal',
    /**
     * An error caught by try/catch where defined using Reactotron.tron.error.
     */
    HANDLED = 'Handled',
}

/**
 * Starts Sentry. Called once from `./app/app.tsx`, before anything renders.
 *
 * Without a DSN nothing is initialised and every function below stays a callable
 * no-op, which is what a local run without a Sentry project wants. `__DEV__` is
 * excluded on purpose: a red screen already says more than an event would, and
 * reloading over a broken hot module would flood the project.
 */
export const initCrashReporting = () => {
    if (!Config.sentryDsn || __DEV__) return;

    Sentry.init({
        dsn: Config.sentryDsn,
        // Ties an event to the JS bundle it came from, so a stack trace can be
        // symbolicated against the source maps uploaded for that build.
        environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? 'production',
        tracesSampleRate: Config.sentryTracesSampleRate,
        // The default attaches the device name and, on some platforms, the user's
        // IP. This app never needs either to act on a crash report.
        sendDefaultPii: false,
    });
};

/**
 * Identifies the crashes belonging to one account, so a report can be tied back to
 * a support request. The numeric id only - no email or name reaches Sentry.
 */
export const setCrashReportingUser = (userId: number) => {
    Sentry.setUser({ id: String(userId) });
};

/**
 * Drops the identity on logout, so events raised afterwards are not attributed to
 * whoever used the device last.
 */
export const clearCrashReportingUser = () => {
    Sentry.setUser(null);
};

/**
 * Manually report a handled error.
 */
export const reportCrash = (error: Error, type: ErrorType = ErrorType.FATAL) => {
    if (__DEV__) {
        // Log to console and Reactotron in development
        const message = error.message || 'Unknown';
        console.error(error);
        console.log(message, type);
    } else {
        Sentry.captureException(error, { tags: { error_type: type } });
    }
};
