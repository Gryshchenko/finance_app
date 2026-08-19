/**
 * `/metrics` on a listener of its own.
 *
 * Caddy proxies every path of the public site to the app port (docker/prod/Caddyfile), so a
 * `/metrics` route on the main app would be world-readable - and the scrape output names every
 * route, lists error rates and leaks uptime and release. A second listener on a port that is
 * never published stays reachable from the compose network (Prometheus) and from nowhere else.
 *
 * No helmet, no rate limiter, no body parser: this listener answers exactly one GET.
 */

import express from 'express';
import http from 'http';

import Logger from 'helper/logger/Logger';
import { getConfig } from 'src/config/config';
import { collectProcessMetrics, registry } from 'src/metrics/metrics';

export function startMetricsServer(): http.Server | undefined {
    const { metricsEnabled, metricsPort } = getConfig();
    if (!metricsEnabled) {
        return undefined;
    }

    collectProcessMetrics();

    const app = express();

    app.get('/metrics', (_req, res) => {
        registry
            .metrics()
            .then((body) => {
                res.setHeader('Content-Type', registry.contentType);
                res.send(body);
            })
            .catch((error: unknown) => {
                Logger.Of('Metrics').error('Failed to render metrics', error);
                res.sendStatus(500);
            });
    });

    app.use((_req, res) => {
        res.sendStatus(404);
    });

    const server = http.createServer(app);
    server.listen(metricsPort, () => {
        Logger.Of('Metrics').info(`Metrics endpoint listening on :${metricsPort}/metrics`);
    });
    return server;
}
