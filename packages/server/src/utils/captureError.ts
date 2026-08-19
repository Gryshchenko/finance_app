import * as Sentry from '@sentry/node';
import { ErrorCode, HttpCode } from '@tenpercent/shared';

import { BaseError } from 'src/utils/errors/BaseError';

/**
 * A `BaseError` carrying a 4xx is the API telling a client its request was wrong -
 * a wrong password, an expired token, a category that is not there. That is normal
 * traffic and reporting it would bury the real defects.
 *
 * Anything else is worth an event: a 5xx the code raised deliberately, or a throw
 * nobody modelled (a driver error, a null dereference), which arrives here as a
 * plain `Error` and is by definition unexpected.
 */
export const isReportableError = (error: unknown): boolean => {
    if (!(error instanceof BaseError)) return true;
    return (error.getStatusCode() ?? HttpCode.INTERNAL_SERVER_ERROR) >= HttpCode.INTERNAL_SERVER_ERROR;
};

/**
 * Sends an error to Sentry unless it is ordinary client-side failure.
 *
 * The request itself is not passed in: Sentry's Express instrumentation keeps the
 * in-flight request on the isolation scope, so method, route and the user set by
 * `tokenVerify` are attached to the event without any of the callers threading
 * `req` through.
 *
 * Without a DSN `captureException` is a no-op, so this stays safe to call from
 * anywhere, tests included.
 */
export const captureError = (error: unknown, context?: { errorCode?: ErrorCode; source?: string }): void => {
    if (!isReportableError(error)) return;

    Sentry.captureException(error, {
        tags: {
            // Compared against undefined, not truthiness: ErrorCode is a zero-based
            // numeric enum and CANT_STORE_DATA - the default half the callers pass - is 0.
            ...(context?.errorCode !== undefined ? { error_code: String(context.errorCode) } : {}),
            ...(context?.source ? { source: context.source } : {}),
        },
    });
};
