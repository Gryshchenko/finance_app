import express from 'express';
import request from 'supertest';

import { httpMetrics } from 'middleware/httpMetrics';
import { httpRequestDuration, httpRequestsInFlight, registry } from 'src/metrics/metrics';

function buildApp() {
    const app = express();
    app.use(httpMetrics);
    app.get('/user/:id', (_req, res) => {
        res.status(200).send('ok');
    });
    app.use((_req, res) => {
        res.sendStatus(404);
    });
    return app;
}

describe('httpMetrics', () => {
    beforeEach(() => {
        httpRequestDuration.reset();
        httpRequestsInFlight.reset();
    });

    it('records a request under its normalized route', async () => {
        await request(buildApp()).get('/user/17').expect(200);

        const scrape = await registry.metrics();

        expect(scrape).toContain('http_request_duration_seconds_count{method="GET",route="/user/:id",status="200"} 1');
    });

    it('puts two requests to different ids on one series', async () => {
        const app = buildApp();
        await request(app).get('/user/17').expect(200);
        await request(app).get('/user/18').expect(200);

        const scrape = await registry.metrics();

        expect(scrape).toContain('http_request_duration_seconds_count{method="GET",route="/user/:id",status="200"} 2');
    });

    it('counts a 404 without letting the path into the label set', async () => {
        await request(buildApp()).get('/wp-login.php').expect(404);

        const scrape = await registry.metrics();

        expect(scrape).toContain('route="unmatched",status="404"');
        expect(scrape).not.toContain('wp-login');
    });

    it('leaves nothing in flight once the response is done', async () => {
        await request(buildApp()).get('/user/17').expect(200);

        await expect(httpRequestsInFlight.get()).resolves.toMatchObject({ values: [{ value: 0 }] });
    });
});
