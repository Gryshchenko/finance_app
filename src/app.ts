const passport = require('passport');
const express = require('express');
const helmet = require('helmet');

const passportSetup = require('./services/auth/passport-setup');
const sessionSetup = require('./services/session/session-setup');
const authMiddleware = require('./middleware/authMiddleware');

const authRouter = require('./routes/auth');

require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;

passportSetup(passport);

app.use(express.json());
app.use(helmet());
app.use(passport.initialize());
app.use(sessionSetup());

app.use('/auth', authRouter);

app.get('/', authMiddleware, (req: any, res: any) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

module.exports = app;
