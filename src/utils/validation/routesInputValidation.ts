import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ResponseStatusType } from 'types/ResponseStatusType';
import { ErrorCode } from 'types/ErrorCode';

const ResponseBuilder = require('../../helper/responseBuilder/ResponseBuilder');

module.exports = function routesInputValidation(validations: any[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        await Promise.all(validations.map((validation) => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        const responseBuilder = new ResponseBuilder().setStatus(ResponseStatusType.INTERNAL).setErrors(
            errors.array().map((value, index, array) => ({
                errorCode: getErrorType(err.param),
                msg: err.msg,
            })),
        );

        res.status(400).json(responseBuilder.build());
    };
};

const getErrorType = (path: string): ErrorCode => {
    switch (path) {
        case 'code':
            return ErrorCode.EMAIL_VERIFICATION_CODE_INVALID;
        case 'email':
            return ErrorCode.EMAIL_INVALID;
        case 'password':
            return ErrorCode.PASSWORD_INVALID;
        default:
            return ErrorCode.UNKNOWN_ERROR;
    }
};
