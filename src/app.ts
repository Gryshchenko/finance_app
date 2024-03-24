const https = require('https');
const fs = require('fs');
const path = require('path');

const passport = require('passport');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const passportSetup = require('./services/auth/passport-setup');
const SessionService = require('./services/session/SessionService');

const authRouter = require('./routes/auth');
const mailVerificationRouter = require('./routes/mailVerification');

require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;

passportSetup(passport);

const privateKey = fs.readFileSync(path.join(__dirname, 'localhost.key'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, 'localhost.cert'), 'utf8');

const credentials = { key: privateKey, cert: certificate };

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    limit: 100,
});

// app.use((req: Request, res: Response, next: NextFunction) => {
//     res.setTimeout(10000, () => { // 10 seconds timeout
//         console.log('Request has timed out.');
//         res.status(408).send('Request timed out');
//     });
//     next();
// });
app.use(express.json({ limit: '10kb' })); // JSON  10kb
app.use(express.urlencoded({ limit: '10kb', extended: true })); // URL-encoded  10kb
app.use(limiter);
app.use(express.json());
app.use(helmet());
app.use(passport.initialize());
app.use(SessionService.setup());

app.use('/auth', authRouter);
app.use('/verification', mailVerificationRouter);

app.get('/', (req: any, res: any) => {
    res.send('Hello World!');
});

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

module.exports = app;
