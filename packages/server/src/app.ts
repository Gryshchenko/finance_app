// Must stay the first import: Sentry instruments express/http/pg/ioredis as they are
// loaded, and a module already required keeps the unpatched reference.

import './instrument';

import * as Sentry from '@sentry/node';
import { ResponseStatusType, ErrorCode } from '@tenpercent/shared';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import passport from 'passport';
import path from 'path';

import Logger from 'helper/logger/Logger';
import { errorHandler } from 'middleware/errorHandler';
import { httpMetrics } from 'middleware/httpMetrics';
import { globalLimiter, readLimiter } from 'middleware/limiters';
import { notFound } from 'middleware/notFound';
import { rateLimitMiddleware } from 'middleware/rateLimit';
import { currenciesRouter, currencyRouter } from 'routes/currency';
import exchangeRates from 'routes/exchangeRates';
import { CurrencyOrchestratorServiceBuilder } from 'services/currencyOrchestrator/CurrencyOrchestratorServiceBuilder';
import { getConfig } from 'src/config/config';
import { createServer } from 'src/createServer';
import ResponseBuilder from 'src/helper/responseBuilder/ResponseBuilder';
import { startMetricsServer } from 'src/metrics/metricsServer';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import { KeyValueStoreBuilder } from 'src/repositories/keyValueStore/KeyValueStoreBuilder';
import { getLocalIP } from 'src/utils/getLocalIP';

import authRouter from './routes/auth';
import registerRouter from './routes/register';
import userRouter from './routes/user';
import passportSetup from './services/auth/passport-setup';

const app = express();
const port = getConfig().appPort ?? 3000;

app.set('trust proxy', 1);

// First in the chain on purpose: a request refused by a rate limiter or rejected by the body
// parser is exactly the one worth counting, and anything mounted above this is invisible to it.
app.use(httpMetrics);

passportSetup(passport);

app.use((req: Request, res: Response, next: NextFunction) => {
    res.setTimeout(10000, () => {
        res.status(408).send(
            new ResponseBuilder()
                .setStatus(ResponseStatusType.INTERNAL)
                .setError({ errorCode: ErrorCode.REQUEST_TIMEOUT_ERROR })
                .build(),
        );
    });
    next();
});

app.use(express.json({ limit: '5kb' }));
app.use(express.urlencoded({ limit: '5kb', extended: true }));
app.use(helmet());
app.use(passport.initialize());

app.use(
    '/public',
    rateLimitMiddleware(readLimiter, (req) => String(req.ip ?? 'unknown')),
    express.static(path.join(process.cwd(), 'public'), {
        etag: true,
        lastModified: true,
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('config.json')) {
                res.setHeader('Cache-Control', 'no-cache');
            } else {
                res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
            }
        },
    }),
);

app.use(rateLimitMiddleware(globalLimiter));

app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/register', registerRouter);
app.use('/currencies', currenciesRouter);
app.use('/currency', currencyRouter);
app.use('/exchange-rates', exchangeRates);
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!!!');
});

// Order matters: the 404 has to sit after every router, and the error handler after the 404.
app.use(notFound);
// Completes the request's trace and marks it failed. Reporting stays with
// `captureError`, so `shouldHandleError` refuses every event and nothing is sent twice.
Sentry.setupExpressErrorHandler(app, { shouldHandleError: () => false });
app.use(errorHandler);

const httpsServer = createServer(app);
let metricsServer: ReturnType<typeof startMetricsServer>;

if (process.env.NODE_ENV !== 'test') {
    metricsServer = startMetricsServer();
    httpsServer.listen(port, async () => {
        const ip = getLocalIP();
        CurrencyOrchestratorServiceBuilder.build()
            .syncCurrenciesRates()
            .catch((e: unknown) => {
                Logger.Of('App').info(`Update currency failed due reason: ${(e as { message: string }).message}`);
            });
        Logger.Of('App').info(`Server running at: ${ip}:${port}`);
    });
}

async function shutdown(signal: unknown): Promise<void> {
    Logger.Of('shutdown').info(`[app] received ${signal}, closing…`);
    httpsServer.close();
    metricsServer?.close();
    await DatabaseConnectionBuilder.build().close();
    await KeyValueStoreBuilder.build().disconnect();
    // Events are batched; without this the last ones die with the process.
    await Sentry.flush(2000);
    Logger.Of('shutdown').info('[app] closed');
}
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('SIGTERM', () => void shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
    Sentry.captureException(err, { tags: { source: 'uncaughtException' } });
    Logger.Of('uncaughtException').error('Error', {
        error: err instanceof Error ? err.message : JSON.stringify(err),
        stack: err instanceof Error ? err.stack : undefined,
    });
});

process.on('unhandledRejection', (err) => {
    Sentry.captureException(err, { tags: { source: 'unhandledRejection' } });
    Logger.Of('unhandledRejection').error('Error', {
        error: err instanceof Error ? err.message : JSON.stringify(err),
        stack: err instanceof Error ? err.stack : undefined,
    });
});

module.exports = httpsServer;
