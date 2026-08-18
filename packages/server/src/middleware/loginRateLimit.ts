import { NextFunction, Request, Response } from 'express';
import { RateLimiterRes } from 'rate-limiter-flexible';

import Logger from 'helper/logger/Logger';
import { loginAccountLimiter, loginIpLimiter } from 'middleware/limiters';
import { rejectSomethingGoWrongRequests, rejectTooManyRequests, setRateLimitHeaders } from 'middleware/rateLimit';

const accountKey = (req: Request) => `${String(req.body?.email ?? '').toLowerCase()}`;

/**
 * Points are consumed up front so parallel requests cannot slip past the check, and refunded
 * when the login succeeds. Consuming on `finish` instead would leave a window where N
 * simultaneous attempts all read the same pre-attempt counter.
 */
export async function loginRateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
    const ipKey = req.ip ?? 'unknown';
    const accKey = accountKey(req);

    try {
        const [ipState, accountState] = await Promise.all([loginIpLimiter.consume(ipKey), loginAccountLimiter.consume(accKey)]);
        setRateLimitHeaders(res, loginIpLimiter.points, ipState);
        setRateLimitHeaders(res, loginAccountLimiter.points, accountState);
    } catch (rejection: unknown) {
        if (rejection instanceof RateLimiterRes) {
            rejectTooManyRequests(res, rejection, loginAccountLimiter.points);
            return;
        }
        Logger.Of('LoginRateLimit').error('Limiter failure', rejection);
        rejectSomethingGoWrongRequests(res);
        return;
    }

    res.on('finish', () => {
        if (res.statusCode < 400) {
            void loginAccountLimiter.delete(accKey);
            void loginIpLimiter.reward(ipKey, 1);
        }
    });

    next();
}
