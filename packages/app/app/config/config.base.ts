export interface ConfigBaseProps {
    persistNavigation: 'always' | 'dev' | 'prod' | 'never';
    catchErrors: 'always' | 'dev' | 'prod' | 'never';
    exitRoutes: string[];
    /**
     * Sentry DSN. Empty leaves the SDK uninitialised and every capture a no-op.
     *
     * It is read from the environment rather than written here because it differs per
     * build. A DSN is not a secret - it only permits writing events - but it is still
     * baked into the shipped bundle like any other value in this folder.
     */
    sentryDsn: string;
    /**
     * Fraction of sessions kept as performance traces. Traces are billed per span.
     */
    sentryTracesSampleRate: number;
}

export type PersistNavigationConfig = ConfigBaseProps['persistNavigation'];

const BaseConfig: ConfigBaseProps = {
    // This feature is particularly useful in development mode, but
    // can be used in production as well if you prefer.
    persistNavigation: 'dev',

    /**
     * Only enable if we're catching errors in the right environment
     */
    catchErrors: 'always',

    /**
     * This is a list of all the route names that will exit the app if the back button
     * is pressed while in that screen. Only affects Android.
     */
    exitRoutes: ['Welcome'],

    // EXPO_PUBLIC_ variables are inlined by Metro at bundle time; unset means Sentry off.
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',

    sentryTracesSampleRate: Number(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
};

export default BaseConfig;
