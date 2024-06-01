import { PassportStatic } from 'passport';

require('dotenv').config();
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
    issuer: 'myapp',
    audience: 'myapp.net',
};

const passportSetup = (passport: PassportStatic) => {
    passport.use(
        new JwtStrategy(options, (jwt_payload: string, done: (a: unknown, b: boolean) => void) => {
            // Здесь логика поиска пользователя по данным в jwt_payload
            // Например, можно искать пользователя в базе данных по id
            // User.findById(jwt_payload.sub, (err, user) => {
            //     if (err) {
            //         return done(err, false);
            //     }
            //     if (user) {
            // return done(null, { name: 'test' });
            //     } else {
            return done(null, false);
            //     }
            // });
        }),
    );
};

export default passportSetup;
