import { ErrorCode, HttpCode, StatsScope } from '@tenpercent/shared';

import { ValidationError } from 'src/utils/errors/ValidationError';

const ALLOWED = Object.values(StatsScope) as string[];

/**
 * Whitelists the `?scope=` query parameter.
 *
 * The value only ever selects a code path (which set of accessible item ids to
 * resolve) - it never reaches a query - but it is still validated against the enum
 * rather than cast, so a typo fails loudly instead of silently widening or narrowing
 * what the caller sees.
 *
 * `fallback` is the endpoint's historical behaviour, used when the parameter is
 * absent. It differs per endpoint: the stats endpoints have always answered with own
 * and shared items merged (`All`), while `/balance` has always counted own accounts
 * only (`Own`).
 */
export const parseStatsScope = (value: unknown, fallback: StatsScope): StatsScope => {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }
    if (typeof value !== 'string' || !ALLOWED.includes(value)) {
        throw new ValidationError({
            statusCode: HttpCode.BAD_REQUEST,
            errorCode: ErrorCode.UNEXPECTED_PROPERTY,
            message: `Invalid scope: expected one of ${ALLOWED.join(', ')}`,
            payload: { field: 'scope', reason: 'validation:unexpected' },
        });
    }
    return value as StatsScope;
};
