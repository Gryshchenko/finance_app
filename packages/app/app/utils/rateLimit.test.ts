import { describeRetryDelay, isExhausted, isLastAttempt, parseRateLimitHeaders } from '@/utils/rateLimit';

describe('parseRateLimitHeaders', () => {
    it('reads the budget from a plain header bag', () => {
        expect(
            parseRateLimitHeaders({
                'x-ratelimit-limit': '5',
                'x-ratelimit-remaining': '1',
                'x-ratelimit-reset': '42',
            }),
        ).toEqual({ limit: 5, remaining: 1, resetSeconds: 42 });
    });

    it('reads the budget through an AxiosHeaders-style getter, case-insensitively', () => {
        const bag: Record<string, string> = {
            'x-ratelimit-limit': '3',
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': '900',
        };
        const headers = { get: (name: string) => bag[name.toLowerCase()] };
        expect(parseRateLimitHeaders(headers)).toEqual({ limit: 3, remaining: 0, resetSeconds: 900 });
    });

    it('falls back to Retry-After when the reset header is missing', () => {
        expect(parseRateLimitHeaders({ 'x-ratelimit-remaining': '0', 'retry-after': '30' })).toEqual({
            limit: undefined,
            remaining: 0,
            resetSeconds: 30,
        });
    });

    it('returns null for responses that carry no budget', () => {
        expect(parseRateLimitHeaders({ 'content-type': 'application/json' })).toBeNull();
        expect(parseRateLimitHeaders(undefined)).toBeNull();
        expect(parseRateLimitHeaders({ 'x-ratelimit-remaining': 'not-a-number' })).toBeNull();
    });

    it('never reports a negative budget', () => {
        expect(parseRateLimitHeaders({ 'x-ratelimit-remaining': '-4', 'x-ratelimit-reset': '-1' })).toEqual({
            limit: undefined,
            remaining: 0,
            resetSeconds: 0,
        });
    });
});

describe('describeRetryDelay', () => {
    it('keeps short waits in seconds', () => {
        expect(describeRetryDelay(42)).toEqual({ tx: 'rateLimit:durationSeconds', value: 42 });
    });

    it('rounds up so a wait is never reported as over', () => {
        expect(describeRetryDelay(0)).toEqual({ tx: 'rateLimit:durationSeconds', value: 1 });
        expect(describeRetryDelay(61)).toEqual({ tx: 'rateLimit:durationMinutes', value: 2 });
    });

    it('switches to minutes and hours as the wait grows', () => {
        expect(describeRetryDelay(900)).toEqual({ tx: 'rateLimit:durationMinutes', value: 15 });
        expect(describeRetryDelay(3600)).toEqual({ tx: 'rateLimit:durationHours', value: 1 });
        expect(describeRetryDelay(5400)).toEqual({ tx: 'rateLimit:durationHours', value: 2 });
    });
});

describe('budget predicates', () => {
    it('flags the last attempt only when exactly one is left', () => {
        expect(isLastAttempt({ limit: 5, remaining: 1, resetSeconds: 10 })).toBe(true);
        expect(isLastAttempt({ limit: 5, remaining: 2, resetSeconds: 10 })).toBe(false);
        expect(isLastAttempt({ limit: 5, remaining: 0, resetSeconds: 10 })).toBe(false);
    });

    it('flags exhaustion when nothing is left', () => {
        expect(isExhausted({ limit: 5, remaining: 0, resetSeconds: 10 })).toBe(true);
        expect(isExhausted({ limit: 5, remaining: 1, resetSeconds: 10 })).toBe(false);
    });
});
