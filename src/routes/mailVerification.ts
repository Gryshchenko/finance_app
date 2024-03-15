import { NextFunction, Request, Response } from 'express';
import { ErrorCode } from 'types/ErrorCode';
import { TranslationsKeys } from 'src/utils/translationsKeys/TranslationsKeys';
import { ResponseStatusType } from 'types/ResponseStatusType';

const { body, validationResult } = require('express-validator');
const tokenVerify = require('../middleware/tokenVerify');
const sessionVerify = require('../middleware/sessionVerify');
const ResponseBuilder = require('../helper/responseBuilder/ResponseBuilder');
const Logger = require('../helper/logger/Logger');
const express = require('express');
const router = express.Router();

const validate = (validations: any[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        await Promise.all(validations.map((validation) => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        const responseBuilder = new ResponseBuilder().setStatus(ResponseStatusType.INTERNAL).setErrors(
            errors.array().map((err: { param: string; msg: string }) => ({
                errorCode: ErrorCode.EMAIL_VERIFICATION_CODE_INVALID,
                msg: err.msg,
            })),
        );

        res.status(400).json(responseBuilder.build());
    };
};

router.post(
    '/mail_verification',
    tokenVerify,
    sessionVerify,
    validate([body('verification_code').isAlphanumeric()]),
    async (req: Request, res: Response) => {
        const _logger = Logger.Of('AuthRouteSignup');
        const responseBuilder = new ResponseBuilder();

        try {
        } catch (error) {
            _logger.error(error);
            res.status(400).json(
                responseBuilder
                    .setStatus(ResponseStatusType.INTERNAL)
                    .setError({ errorCode: ErrorCode.CANT_STORE_DATA, msg: TranslationsKeys.SOMETHING_WRONG })
                    .build(),
            );
        }
    },
);

module.exports = router;
