/**
 * Times every request and records it under a *normalized* route.
 *
 * The route label is the only place in these metrics where the outside world picks the label
 * value, so it is the only place cardinality can run away: one series per distinct URL means a
 * scanner walking `/wp-admin`, `/.env`, `/api/v1/…` mints series faster than any retention
 * setting can retire them. Two rules keep the set closed:
 *
 *   1. path segments that carry data (ids, uuids, emails, tokens) collapse to a placeholder;
 *   2. anything whose first segment is not a router this app actually mounts becomes
 *      `unmatched` - a single series for the entire internet's worth of junk.
 *
 * `req.route` is deliberately not used: express restores `req.baseUrl` as the router stack
 * unwinds, so by the time `finish` fires the mount path may already be gone.
 */

import { NextFunction, Request, Response } from 'express';

import { httpRequestDuration, httpRequestsInFlight } from 'src/metrics/metrics';

/** Keep in sync with the routers mounted in app.ts. Anything else is reported as `unmatched`. */
const KNOWN_PREFIXES = new Set(['', 'auth', 'user', 'register', 'currencies', 'currency', 'exchange-rates', 'public']);

/** Methods a client can use to mint a label value; everything else shares one series. */
const KNOWN_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

const MAX_SEGMENTS = 6;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeSegment(segment: string): string {
    if (/^\d+$/.test(segment)) {
        return ':id';
    }
    if (UUID.test(segment)) {
        return ':uuid';
    }
    if (segment.includes('@')) {
        return ':email';
    }
    // Long opaque segments are tokens and confirmation codes - unbounded by definition.
    if (segment.length > 24) {
        return ':token';
    }
    return segment;
}

export function normalizeRoute(path: string): string {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) {
        return '/';
    }
    if (!KNOWN_PREFIXES.has(segments[0].toLowerCase())) {
        return 'unmatched';
    }
    const head = segments.slice(0, MAX_SEGMENTS).map(normalizeSegment);
    const tail = segments.length > MAX_SEGMENTS ? ['*'] : [];
    return `/${[...head, ...tail].join('/')}`;
}

export function httpMetrics(req: Request, res: Response, next: NextFunction): void {
    const stopTimer = httpRequestDuration.startTimer();
    httpRequestsInFlight.inc();

    let recorded = false;
    // `finish` covers a completed response, `close` a client that hung up mid-flight. Both fire
    // in the second case, so the first one to arrive wins.
    const record = (): void => {
        if (recorded) {
            return;
        }
        recorded = true;
        httpRequestsInFlight.dec();
        stopTimer({
            method: KNOWN_METHODS.has(req.method) ? req.method : 'OTHER',
            route: normalizeRoute(req.path),
            status: String(res.statusCode),
        });
    };

    res.once('finish', record);
    res.once('close', record);

    next();
}
