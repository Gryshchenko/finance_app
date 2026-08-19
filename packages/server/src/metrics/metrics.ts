/**
 * Prometheus metric definitions.
 *
 * Everything lives on a private registry rather than the library's global one: a global
 * registry is process-wide state, so a second `new Histogram(...)` with the same name - which
 * is what a jest module reset looks like - throws on registration.
 *
 * Cardinality is the budget that matters here. A Grafana Cloud free tier caps active series at
 * ~10k, and one careless label (a user id, a raw URL path) is enough to spend it. Every label
 * below takes values from a closed set; `normalizeRoute` in middleware/httpMetrics.ts is what
 * keeps the `route` label closed.
 */

import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from 'prom-client';

import Logger from 'helper/logger/Logger';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export const registry = new Registry();

/**
 * Buckets are the request latencies worth telling apart, not a uniform scale: the interesting
 * questions are "is the p95 still under 250ms" and "how many requests hit the 10s timeout in
 * app.ts". Each bucket is one more series per label combination, so the list stays short.
 */
const LATENCY_BUCKETS_SECONDS = [0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

export const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request latency, from the first middleware to the end of the response',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: LATENCY_BUCKETS_SECONDS,
    registers: [registry],
});

export const httpRequestsInFlight = new Gauge({
    name: 'http_requests_in_flight',
    help: 'Requests currently being served',
    registers: [registry],
});

/**
 * Both refusal paths of the rate limiters, split by `reason`:
 *   quota   - the client spent its budget (429)
 *   backend - Redis and the in-memory insurance limiter both failed (503)
 *
 * A rising `quota` is a client problem, a rising `backend` is ours; a single counter with a
 * label keeps them on one graph without a second metric name.
 */
export const rateLimitRejections = new Counter({
    name: 'rate_limit_rejections_total',
    help: 'Requests refused by a rate limiter',
    labelNames: ['limiter', 'reason'] as const,
    registers: [registry],
});

/**
 * The knex pool, sampled at scrape time. `pendingAcquires` is the one to alert on: it means
 * requests are queueing for a connection, which shows up as latency long before any error does.
 */
export const dbPoolConnections = new Gauge({
    name: 'db_pool_connections',
    help: 'knex/tarn connection pool, by state',
    labelNames: ['state'] as const,
    registers: [registry],
    collect() {
        try {
            const pool = DatabaseConnectionBuilder.build().engine().client?.pool;
            if (!pool) {
                return;
            }
            this.set({ state: 'used' }, pool.numUsed());
            this.set({ state: 'free' }, pool.numFree());
            this.set({ state: 'pending_acquire' }, pool.numPendingAcquires());
            this.set({ state: 'pending_create' }, pool.numPendingCreation());
        } catch (error) {
            // A scrape must never take the process down, and a pool that cannot be read is
            // itself reported by the absence of the series.
            Logger.Of('Metrics').error('Failed to read the db pool', error);
        }
    },
});

export function observeRateLimitRejection(limiter: string, reason: 'quota' | 'backend'): void {
    rateLimitRejections.inc({ limiter, reason });
}

/**
 * Process-level metrics (heap, GC, event loop lag, open handles) are registered here rather
 * than at import time so that importing a metric never starts the event-loop monitor - jest
 * would otherwise carry it into every suite that touches a middleware.
 */
export function collectProcessMetrics(): void {
    collectDefaultMetrics({ register: registry });
}
