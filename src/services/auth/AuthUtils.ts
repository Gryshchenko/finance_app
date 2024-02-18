import * as process from 'process';
import { RoleType } from 'types/RoleType';

require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = class AuthUtils {
    public static createJWToken(userId: string, role: RoleType): string {
        return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
            expiresIn: '12h',
            issuer: process.env.JWT_ISSUER,
            audience: process.env.JWT_AUDIENCE,
        });
    }
    public static tokenNeedsRefresh(expirationTime: number) {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeLeft = expirationTime - currentTime;
        return timeLeft < 10 * 60;
    }
};
