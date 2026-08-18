import { HttpCode } from '@tenpercent/shared';
import { format } from 'date-fns/format';

import { translate } from '@/i18n/translate';
import ToastService from '@/services/ToastService';
import { Logger } from '@/utils/logger/Logger';
import {
    describeRetryDelay,
    isExhausted,
    isLastAttempt,
    parseRateLimitHeaders,
    RateLimitHeaders,
    RateLimitState,
} from '@/utils/rateLimit';

/**
 * A screen usually fires several requests at once, and every one of them carries the same
 * budget headers. Without a cooldown the user gets the same warning stacked three or four
 * times. Slightly longer than the toast itself, so a repeat never overlaps the one on screen.
 */
const NOTICE_COOLDOWN_MS = 4000;

const BLOCKED_TOAST_DURATION_MS = 6000;

/** Below this a clock time reads as noise ("blocked until 14:32" for a 20 second wait). */
const UNTIL_TIME_THRESHOLD_SEC = 60;

/**
 * Turns the `X-RateLimit-*` headers the server puts on every answer into something the user can
 * act on: a heads-up while there is still one request left, and a plain statement of how long
 * the wait is once there are none.
 */
class RateLimitService {
    private static readonly _logger: Logger = Logger.Of('RateLimitService');
    private static lastWarningAt = 0;
    private static lastBlockedAt = 0;

    /** The cooldowns are process-wide state; tests need a clean slate between cases. */
    static reset(): void {
        RateLimitService.lastWarningAt = 0;
        RateLimitService.lastBlockedAt = 0;
    }

    static handleResponse(headers: RateLimitHeaders, status?: number): void {
        try {
            const state = parseRateLimitHeaders(headers);
            const rejected = status === HttpCode.TOO_MANY_REQUESTS;
            if (!state) {
                // A 429 without headers should not happen - the server always sets them on that
                // path - but the user still deserves an explanation if it ever does.
                if (rejected) {
                    RateLimitService.notifyBlocked(null);
                }
                return;
            }
            if (rejected || isExhausted(state)) {
                RateLimitService.notifyBlocked(state);
                return;
            }
            if (isLastAttempt(state)) {
                RateLimitService.notifyLastAttempt();
            }
        } catch (e) {
            RateLimitService._logger.error(`Failed to read rate limit headers: ${(e as Error)?.message}`);
        }
    }

    private static passesCooldown(last: number): boolean {
        return Date.now() - last >= NOTICE_COOLDOWN_MS;
    }

    private static notifyLastAttempt(): void {
        if (!RateLimitService.passesCooldown(RateLimitService.lastWarningAt)) {
            return;
        }
        RateLimitService.lastWarningAt = Date.now();
        ToastService.warning({ title: 'common:warning', message: 'rateLimit:lastAttempt' });
    }

    private static notifyBlocked(state: RateLimitState | null): void {
        if (!RateLimitService.passesCooldown(RateLimitService.lastBlockedAt)) {
            return;
        }
        RateLimitService.lastBlockedAt = Date.now();
        // A block also means the warning is spent: the next one should be about the new window.
        RateLimitService.lastWarningAt = 0;

        const seconds = state?.resetSeconds ?? 0;
        if (seconds <= 0) {
            ToastService.error({
                title: 'common:error',
                message: 'rateLimit:blockedUnknown',
                duration: BLOCKED_TOAST_DURATION_MS,
            });
            return;
        }

        const delay = describeRetryDelay(seconds);
        const duration = translate(delay.tx, { value: delay.value });
        if (seconds < UNTIL_TIME_THRESHOLD_SEC) {
            ToastService.error({
                title: 'common:error',
                message: 'rateLimit:blocked',
                duration: BLOCKED_TOAST_DURATION_MS,
                txOptions: { duration },
            });
            return;
        }

        ToastService.error({
            title: 'common:error',
            message: 'rateLimit:blockedUntil',
            duration: BLOCKED_TOAST_DURATION_MS,
            txOptions: { duration, time: format(new Date(Date.now() + seconds * 1000), 'HH:mm') },
        });
    }
}

export default RateLimitService;
