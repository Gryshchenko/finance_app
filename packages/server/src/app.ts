import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import passportSetup from './services/auth/passport-setup';

import authRouter from './routes/auth';
import registerRouter from './routes/register';
import userRouter from './routes/user';
import { getConfig } from 'src/config/config';
import ResponseBuilder from 'src/helper/responseBuilder/ResponseBuilder';
import { checkCors } from 'middleware/checkCors';
import { getLocalIP } from 'src/utils/getLocalIP';

import passport from 'passport';
import { currenciesRouter, currencyRouter } from 'routes/currency';
import exchangeRates from 'routes/exchangeRates';
import ExchangeRateServiceBuilder from 'services/exchangeRateService/ExchangeRateServiceBuilder';
import Logger from 'helper/logger/Logger';
import { ResponseStatusType } from 'tenpercent/shared';
import { ErrorCode } from 'tenpercent/shared';
import { createServer } from 'src/createServer';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import { KeyValueStoreBuilder } from 'src/repositories/keyValueStore/KeyValueStoreBuilder';
import path from 'path';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const app = express();
const port = getConfig().appPort ?? 3000;

passportSetup(passport);

if (process.env.NODE_ENV !== 'test') {
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 min
        limit: 100,
    });
    app.use(limiter);
}
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

// app.use(checkOriginReferer);
app.use(checkCors());

app.use(express.json({ limit: '5kb' }));
app.use(express.urlencoded({ limit: '5kb', extended: true }));
app.use(express.json());
app.use(helmet());
app.use(passport.initialize());

app.use(
    '/public',
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

app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/register', registerRouter);
app.use('/currencies', currenciesRouter);
app.use('/currency', currencyRouter);
app.use('/exchange-rates', exchangeRates);
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!!!');
});

const httpsServer = createServer(app);

if (process.env.NODE_ENV !== 'test') {
    httpsServer.listen(port, async () => {
        const ip = getLocalIP();
        ExchangeRateServiceBuilder.build()
            .updateCurrencyRates()
            .catch((e) => {
                Logger.Of('App').info(`Update currency failed due reason: ${(e as { message: string }).message}`);
            });
        Logger.Of('App').info(`Server running at: ${ip}:${port}`);
    });
}

async function shutdown(signal: unknown): Promise<void> {
    Logger.Of('shutdown').info(`[app] received ${signal}, closing…`);
    httpsServer.close();
    await DatabaseConnectionBuilder.build().close();
    await KeyValueStoreBuilder.build().disconnect();
    Logger.Of('shutdown').info('[app] closed');
}
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('SIGTERM', () => void shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
    Logger.Of('uncaughtException').error('Error', {
        error: err instanceof Error ? err.message : JSON.stringify(err),
        stack: err instanceof Error ? err.stack : undefined,
    });
});

process.on('unhandledRejection', (err) => {
    Logger.Of('unhandledRejection').error('Error', {
        error: err instanceof Error ? err.message : JSON.stringify(err),
        stack: err instanceof Error ? err.stack : undefined,
    });
});

module.exports = httpsServer;
