import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from 'types/ErrorCode';
import { TranslationsKeys } from 'src/utils/translationsKeys/TranslationsKeys';
import { IUserSession } from 'interfaces/IUserSession';

require('dotenv').config();
const SessionUtils = require('../services/session/SessionUtils');
const _logger = require('../helper/logger/Logger').Of('SessionVerify');

const extractSession = (req: Request): IUserSession => {
    // @ts-ignore
    return req.session.user;
};

const sessionVerify = (req: Request, res: Response, next: NextFunction) => {
    const userSession = extractSession(req);
    if (!userSession) {
        _logger.info('session could not verify, userSession = null');
        SessionUtils.deleteSession(req, res, () => {
            res.status(401).json({ errorCode: ErrorCode.AUTH, msg: TranslationsKeys.SESSION_EXPIRED });
        });
    } else {
        _logger.info('session verify success');
        next();
    }
};

module.exports = sessionVerify;
