import { PassportStatic } from 'passport';
import { getConfig } from 'src/config/config';

import { Strategy as JwtStrategy, StrategyOptionsWithRequest } from 'passport-jwt';

const { ExtractJwt } = require('passport-jwt');

const options: StrategyOptionsWithRequest = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: getConfig().jwtSecret,
    issuer: 'myapp',
    audience: 'myapp.net',
    algorithms: ['HS384'],
    passReqToCallback: true,
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
