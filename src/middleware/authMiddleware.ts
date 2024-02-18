import { Request, Response, NextFunction } from 'express';
import { VerifyErrors } from 'jsonwebtoken';
import { IDecodeOptions } from 'interfaces/IDecodeOptions';
import { ErrorCode } from 'types/ErrorCode';
import { TranslationsKeys } from 'src/utils/translationsKeys/TranslationsKeys';

const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err: VerifyErrors, decoded: IDecodeOptions) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    res.status(401).json({ errorCode: ErrorCode.AUTH, msg: TranslationsKeys.TOKEN_EXPIRED });
                } else {
                    res.status(401).json({ errorCode: ErrorCode.AUTH, msg: TranslationsKeys.INVALID_TOKEN });
                }
            } else {
                next();
            }
        });
    }
};

module.exports = authMiddleware;
