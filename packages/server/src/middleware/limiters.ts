import { createLimiter } from 'middleware/rateLimit';

export const globalLimiter = createLimiter({
    keyPrefix: 'rl:global',
    points: 300,
    duration: 60,
});

export const userLimiter = createLimiter({
    keyPrefix: 'rl:user',
    points: 240,
    duration: 60,
});

export const readLimiter = createLimiter({
    keyPrefix: 'rl:read',
    points: 100,
    duration: 60,
});

/**
 * Per-IP budget for `/register/signup`. The per-address limiters below are keyed by email, so
 * they stop someone hammering one address but do nothing against an attacker walking a list of
 * addresses one attempt each - which is exactly what account enumeration looks like. This caps
 * how many distinct addresses a single source can probe per hour.
 */
export const signupIpLimiter = createLimiter({
    keyPrefix: 'rl:signup:ip',
    points: 10,
    duration: 60 * 60,
    // blockDuration: 60 * 60,
});

/**
 * Putting a message in someone's inbox: `/auth/forget` and `/auth/forget-refresh`.
 *
 * Sending and verifying cannot share one budget. The dispatch side has to be small enough that
 * it cannot be used to flood an inbox, and a number that small is spent by the ordinary flow -
 * request a code, ask for a resend, mistype it once - which locked the address out of its own
 * recovery for an hour. Keeping them apart lets this stay tight while `codeAttemptLimiter`
 * leaves room for a person to fumble the code.
 */
export const emailDispatchLimiter = createLimiter({
    keyPrefix: 'rl:email:dispatch',
    points: 3,
    duration: 60 * 60,
    blockDuration: 60 * 60,
});

/**
 * Guesses against an emailed confirmation code. The code is 8 uniformly random digits and lives
 * ten minutes; this budget, not the code itself, is what keeps the search space out of reach.
 */
export const codeAttemptLimiter = createLimiter({
    keyPrefix: 'rl:email:code',
    points: 5,
    duration: 60 * 15,
    blockDuration: 60 * 15,
});

/**
 * Signup carries its own dispatch budget, on its own key prefix: registrations aimed at an
 * address must not be able to lock its owner out of password recovery.
 */
export const signupEmailLimiter = createLimiter({
    keyPrefix: 'rl:email:signup',
    points: 3,
    duration: 60 * 60,
    blockDuration: 60 * 60,
});

export const loginIpLimiter = createLimiter({
    keyPrefix: 'rl:login:ip',
    points: 30,
    duration: 60 * 60,
    blockDuration: 60 * 15,
});

export const loginAccountLimiter = createLimiter({
    keyPrefix: 'rl:login:account',
    points: 5,
    duration: 60 * 15,
    blockDuration: 60 * 30,
});
