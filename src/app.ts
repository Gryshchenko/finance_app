import express, { NextFunction, Request, Response } from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import passportSetup from './services/auth/passport-setup';
import SessionService from './services/session/SessionService';

import authRouter from './routes/auth';
import registerRouter from './routes/register';
import profileRouter from './routes/profile';
import { getConfig } from 'src/config/config';
import ResponseBuilder from 'src/helper/responseBuilder/ResponseBuilder';
import { ResponseStatusType } from 'types/ResponseStatusType';
import { ErrorCode } from 'types/ErrorCode';

const passport = require('passport');

const app = express();
const port = getConfig().appPort ?? 3000;

passportSetup(passport);

const privateKey = fs.readFileSync(path.join(__dirname, 'localhost.key'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, 'localhost.cert'), 'utf8');

const credentials = { key: privateKey, cert: certificate };

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    limit: 100,
});

app.use((req: Request, res: Response, next: NextFunction) => {
    res.setTimeout(10000, () => {
        res.status(408).send(
            new ResponseBuilder()
                .setStatus(ResponseStatusType.INTERNAL)
                .setError({ errorCode: ErrorCode.REQUEST_TIMEOUT })
                .build(),
        );
    });
    next();
});
app.use(express.json({ limit: '5kb' }));
app.use(express.urlencoded({ limit: '5kb', extended: true }));
app.use(limiter);
app.use(express.json());
app.use(helmet());
app.use(passport.initialize());
app.use(SessionService.setup());

app.use('/auth', authRouter);
app.use('/profile', profileRouter);
app.use('/register', registerRouter);

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!!!');
});

const httpsServer = https.createServer(credentials, app);

if (process.env.NODE_ENV !== 'test') {
    httpsServer.listen(port, () => {
        console.log(`listening on port ${port}`);
    });
}

module.exports = app;
