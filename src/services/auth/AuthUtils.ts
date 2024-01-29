import * as process from 'process';

require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = class AuthUtils {
    public static createJWToken(userId: string): string {
        return jwt.sign({ userId: userId }, process.env.JWT_SECRET, {
            expiresIn: '12h',
            issuer: process.env.JWT_ISSUER,
            audience: process.env.JWT_AUDIENCE,
        });
    }
};
