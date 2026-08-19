import { ResponseStatusType, ErrorCode, HttpCode } from '@tenpercent/shared';
import { NextFunction, Request, Response } from 'express';
import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes, IRateLimiterStoreOptions } from 'rate-limiter-flexible';

import Logger from 'helper/logger/Logger';
import { getConfig } from 'src/config/config';
import ResponseBuilder from 'src/helper/responseBuilder/ResponseBuilder';
import { observeRateLimitRejection } from 'src/metrics/metrics';
import { KeyValueStore } from 'src/repositories/keyValueStore/KeyValueStore';

const storeClient = () =>
    KeyValueStore.instance({
        url: getConfig().redisHost,
        port: Number(getConfig().redisPort),
        prefix: getConfig().redisPrefix,
    }).getClient();

type LimiterOptions = Omit<IRateLimiterStoreOptions, 'storeClient' | 'insuranceLimiter'>;

export function createLimiter(options: LimiterOptions): RateLimiterRedis {
    return new RateLimiterRedis({
        ...options,
        storeClient: storeClient(),
        insuranceLimiter: new RateLimiterMemory({
            points: options.points,
            duration: options.duration,
            blockDuration: options.blockDuration,
        }),
    });
}

/**
 * Several limiters may run on one request (global → per-user → per-route). The client only
 * cares about the tightest budget, so a later limiter overwrites the headers only when it
 * leaves fewer points than whatever is already there.
 */
export function setRateLimitHeaders(res: Response, limit: number, state: RateLimiterRes): void {
    if (res.headersSent) {
        return;
    }
    const remaining = Math.max(0, state.remainingPoints);
    const previous = res.getHeader('X-RateLimit-Remaining');
    if (previous !== undefined && Number(previous) <= remaining) {
        return;
    }
    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(state.msBeforeNext / 1000)));
}

/**
 * `limiter` names which budget ran out. It comes from the limiter's own `keyPrefix`, a value
 * this module writes (middleware/limiters.ts), so the label set stays closed no matter what a
 * client sends.
 */
export function rejectTooManyRequests(res: Response, rejection: RateLimiterRes, limit?: number, limiter = 'unknown'): void {
    observeRateLimitRejection(limiter, 'quota');
    const retryAfter = Math.ceil(rejection.msBeforeNext / 1000) || 1;
    res.setHeader('Retry-After', String(retryAfter));
    if (limit !== undefined) {
        res.setHeader('X-RateLimit-Limit', String(limit));
    }
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, rejection.remainingPoints)));
    res.setHeader('X-RateLimit-Reset', String(retryAfter));
    res.status(HttpCode.TOO_MANY_REQUESTS).send(
        new ResponseBuilder()
            .setStatus(ResponseStatusType.INTERNAL)
            .setError({ errorCode: ErrorCode.TOO_MANY_REQUESTS_ERROR })
            .build(),
    );
}

/**
 * How long a client should wait out a limiter failure. Fixed and short: unlike the 429 path
 * there is no window to report, and the condition clears as soon as the backend recovers.
 */
const LIMITER_FAILURE_RETRY_AFTER_SEC = 5;

/**
 * The limiter backend itself failed, so the request is refused rather than let through
 * unmetered.
 *
 * 503, not 504: nothing upstream timed out - this service cannot serve the request right now.
 * `Retry-After` is set for the same reason it is on the 429 path, so a client needs one backoff
 * branch for "refused, try later" instead of two.
 */
export function rejectSomethingGoWrongRequests(res: Response, limiter = 'unknown'): void {
    observeRateLimitRejection(limiter, 'backend');
    res.setHeader('Retry-After', String(LIMITER_FAILURE_RETRY_AFTER_SEC));
    res.status(HttpCode.SERVICE_UNAVAILABLE).send(
        new ResponseBuilder().setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.UNKNOWN_ERROR }).build(),
    );
}

export function rateLimitMiddleware(
    limiter: RateLimiterRedis,
    keyGenerator: (req: Request) => string = (req) => req.ip ?? 'unknown',
) {
    const limit = limiter.points;
    return (req: Request, res: Response, next: NextFunction): void => {
        // Read per request rather than at import time so a test can flip the switch around a
        // single case (config.ts explains when the limiters are off by default).
        if (!getConfig().rateLimitEnabled) {
            next();
            return;
        }
        // CORS preflight carries no payload and must not eat the budget
        if (req.method === 'OPTIONS') {
            next();
            return;
        }
        limiter
            .consume(keyGenerator(req))
            .then((state) => {
                setRateLimitHeaders(res, limit, state);
                next();
            })
            .catch((rejection: unknown) => {
                if (rejection instanceof RateLimiterRes) {
                    rejectTooManyRequests(res, rejection, limit, limiter.keyPrefix);
                    return;
                }
                Logger.Of('RateLimit').error('Limiter failure', rejection);
                rejectSomethingGoWrongRequests(res, limiter.keyPrefix);
            });
    };
}
