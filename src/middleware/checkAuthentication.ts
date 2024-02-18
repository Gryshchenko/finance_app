import { Request, Response, NextFunction } from 'express';
import { VerifyErrors } from 'jsonwebtoken';
import { IDecodeOptions } from 'interfaces/IDecodeOptions';

const jwt = require('jsonwebtoken');
require('dotenv').config();

const checkAuthentication = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err: VerifyErrors, decoded: IDecodeOptions) => {
            if (err) {
                next();
            } else {
                res.redirect('/dashboard');
            }
        });
    } else {
        next();
    }
};

module.exports = checkAuthentication;
