/**
 * Sentry has to be initialised before anything else is required.
 *
 * The Node SDK instruments Express, `http`, `pg` and `ioredis` by monkey-patching
 * their exports as they are loaded. A module that was already required keeps the
 * unpatched reference, so importing this file anywhere but on the first line of
 * `app.ts` silently costs the request traces and the automatic error capture that
 * comes with them.
 *
 * Without SENTRY_DSN the SDK is never initialised at all: `Sentry.captureException`
 * and friends stay callable and become no-ops, which is what local runs and the
 * test suite want.
 */
import * as Sentry from '@sentry/node';

import { getConfig } from './config/config';

const { sentryDsn, sentryEnvironment, sentryRelease, sentryTracesSampleRate } = getConfig();

if (sentryDsn) {
    Sentry.init({
        dsn: sentryDsn,
        environment: sentryEnvironment,
        release: sentryRelease,
        // 1.0 in development, a fraction in production - traces are billed per span.
        tracesSampleRate: sentryTracesSampleRate,
        // The mobile client is the only consumer, and it sends no cookies; keeping
        // headers and bodies out of the event avoids shipping bearer tokens to Sentry.
        sendDefaultPii: false,
        beforeSend(event) {
            if (event.request?.headers) {
                delete event.request.headers.authorization;
                delete event.request.headers.cookie;
            }
            delete event.request?.data;
            return event;
        },
    });
}

export { Sentry };
