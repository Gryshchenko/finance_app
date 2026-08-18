import { TxKeyPath } from '@/i18n';

/**
 * What the server tells us about the budget left for this client on the route it just served.
 * The server reports the tightest limiter that ran, so this is always the number that will
 * actually bite next.
 */
export interface RateLimitState {
    /** Total points in the window, when the server reported one. */
    limit: number | undefined;
    /** Requests left before the route starts refusing. Never negative. */
    remaining: number;
    /** Seconds until the budget refills (or until a block lifts). */
    resetSeconds: number;
}

/** A wait expressed in the coarsest unit that still reads honestly, ready to be translated. */
export interface RetryDelay {
    tx: TxKeyPath;
    value: number;
}

type HeaderValue = string | number | string[] | undefined | null;

interface HeaderGetter {
    get: (name: string) => HeaderValue;
}

export type RateLimitHeaders = Record<string, HeaderValue> | HeaderGetter | undefined | null;

const REMAINING_HEADER = 'x-ratelimit-remaining';
const LIMIT_HEADER = 'x-ratelimit-limit';
const RESET_HEADER = 'x-ratelimit-reset';
const RETRY_AFTER_HEADER = 'retry-after';

const hasGetter = (headers: NonNullable<RateLimitHeaders>): headers is HeaderGetter =>
    typeof (headers as HeaderGetter).get === 'function';

/**
 * Header names are case-insensitive, and what we get here is either an AxiosHeaders instance or
 * a plain object whose casing depends on the platform's fetch implementation. Both are handled.
 */
const readHeader = (headers: RateLimitHeaders, name: string): string | undefined => {
    if (!headers) {
        return undefined;
    }
    const raw = hasGetter(headers)
        ? headers.get(name)
        : (headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()]);
    if (raw === undefined || raw === null) {
        return undefined;
    }
    const value = Array.isArray(raw) ? raw[0] : raw;
    return String(value);
};

const toNumber = (value: string | undefined): number | undefined => {
    if (value === undefined || value.trim() === '') {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * Returns null for every response that carried no budget information - most routes in local
 * development, and anything served before the limiter middleware runs.
 */
export const parseRateLimitHeaders = (headers: RateLimitHeaders): RateLimitState | null => {
    const remaining = toNumber(readHeader(headers, REMAINING_HEADER));
    if (remaining === undefined) {
        return null;
    }
    const reset = toNumber(readHeader(headers, RESET_HEADER)) ?? toNumber(readHeader(headers, RETRY_AFTER_HEADER)) ?? 0;
    return {
        limit: toNumber(readHeader(headers, LIMIT_HEADER)),
        remaining: Math.max(0, remaining),
        resetSeconds: Math.max(0, reset),
    };
};

const MINUTE = 60;
const HOUR = 60 * 60;

/**
 * Rounds up, never to zero: telling someone to retry in "0 seconds" on a wait that is still
 * running invites them straight back into the block.
 */
export const describeRetryDelay = (seconds: number): RetryDelay => {
    const safe = Math.max(1, Math.ceil(seconds));
    if (safe < MINUTE) {
        return { tx: 'rateLimit:durationSeconds' as TxKeyPath, value: safe };
    }
    if (safe < HOUR) {
        return { tx: 'rateLimit:durationMinutes' as TxKeyPath, value: Math.ceil(safe / MINUTE) };
    }
    return { tx: 'rateLimit:durationHours' as TxKeyPath, value: Math.ceil(safe / HOUR) };
};

/** One request left - the next one is the last, so this is the moment to warn. */
export const isLastAttempt = (state: RateLimitState): boolean => state.remaining === 1;

export const isExhausted = (state: RateLimitState): boolean => state.remaining <= 0;
