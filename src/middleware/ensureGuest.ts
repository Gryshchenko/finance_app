import { Request, Response, NextFunction } from 'express';
import { VerifyErrors } from 'jsonwebtoken';
import { ErrorCode } from 'types/ErrorCode';
import { TranslationsKeys } from 'src/utils/translationsKeys/TranslationsKeys';
import { IUserSession } from 'interfaces/IUserSession';

require('dotenv').config();
const _logger = require('../helper/logger/Logger').Of('EnsureGuest');

const extractSession = (req: Request): IUserSession => {
    // @ts-ignore
    return req.session.user;
};

const ensureGuest = (req: Request, res: Response, next: NextFunction) => {
    const userSession = extractSession(req);
    if (userSession && userSession.userId) {
        _logger.info('access forbidden user already authenticated');
        res.status(401).json({ errorCode: ErrorCode.AUTH, msg: TranslationsKeys.ALREADY_AUTHENTICATED });
    } else {
        _logger.info('access allow guest not authenticated');
        next();
    }
};

module.exports = ensureGuest;
