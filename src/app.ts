const https = require('https');
const fs = require('fs');
const path = require('path');

const passport = require('passport');
const express = require('express');
const helmet = require('helmet');

const passportSetup = require('./services/auth/passport-setup');
const sessionSetup = require('./services/session/session-setup');

const authRouter = require('./routes/auth');

require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;

passportSetup(passport);

const privateKey = fs.readFileSync(path.join(__dirname, 'localhost.key'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, 'localhost.cert'), 'utf8');

const credentials = { key: privateKey, cert: certificate };

app.use(express.json());
app.use(helmet());
app.use(passport.initialize());
app.use(sessionSetup());

app.use('/auth', authRouter);

app.get('/', (req: any, res: any) => {
    res.send('Hello World!');
});

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

module.exports = app;
