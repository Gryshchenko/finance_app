import { PassportStatic } from 'passport';
import { getConfig } from 'src/config/config';

import { Strategy as JwtStrategy, StrategyOptionsWithRequest } from 'passport-jwt';
import UserServiceBuilder from 'src/services/user/UserServiceBuilder';
import { IUser } from 'interfaces/IUser';

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
        new JwtStrategy(options, (jwt_payload: { sub: string }, done: (a: unknown, b: IUser | boolean) => void) => {
            const userService = UserServiceBuilder.build();
            userService
                .getUser(parseInt(jwt_payload.sub, 10))
                .then((user) => {
                    if (user?.userId) {
                        done(null, user);
                    } else {
                        done(null, false);
                    }
                })
                .catch((error) => {
                    return done(error, false);
                });
        }),
    );
};

export default passportSetup;
