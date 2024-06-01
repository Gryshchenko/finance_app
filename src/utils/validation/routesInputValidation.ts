import { NextFunction, Request, Response } from 'express';
import { body, ValidationChain, validationResult } from 'express-validator';
import { ResponseStatusType } from 'types/ResponseStatusType';
import { ErrorCode } from 'types/ErrorCode';
import ResponseBuilder from 'src/helper/responseBuilder/ResponseBuilder';
import Logger from 'src/helper/logger/Logger';

interface IOptions {
    max: number;
    min: number;
    onlyASCII: boolean;
    escapeHTML: boolean;
    optional: boolean;
}

export function createSignupValidationRules(field: string, type: string, options: Partial<IOptions> = {}) {
    let validatorChain = body(field);

    if (options.optional) {
        validatorChain = validatorChain.optional({ checkFalsy: true });
    }

    if (options.onlyASCII) {
        validatorChain = validatorChain.matches(/^[ -~]*$/).withMessage(`Field ${field} must contain only ASCII characters`);
    }

    if (options.escapeHTML) {
        validatorChain = validatorChain.escape();
    }

    if (type === 'email') {
        validatorChain = validatorChain.isEmail();
    } else if (type === 'password') {
        validatorChain = validatorChain.isStrongPassword();
    } else if (type === 'number') {
        validatorChain = validatorChain.isNumeric().isInt({ max: Number.MAX_SAFE_INTEGER, min: Number.MIN_SAFE_INTEGER });
    } else if (type === 'string') {
        validatorChain = validatorChain.isString();
        if (field === 'locale') {
            validatorChain = validatorChain
                .matches(/^[a-zA-Z]{2}-[a-zA-Z]{2}$/, 'i')
                .withMessage(`Field ${field} must be in locale format (e.g., en-US)`);
        }
    }

    if (options.max && type !== 'number') {
        validatorChain = validatorChain.isLength({ max: options.max });
    }

    if (options.min && type !== 'number') {
        validatorChain = validatorChain.isLength({ min: options.min });
    }

    return [validatorChain];
}

export default function routesInputValidation(validations: ValidationChain[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        await Promise.all(validations.map((validation) => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        const responseBuilder = new ResponseBuilder().setStatus(ResponseStatusType.INTERNAL).setErrors(
            errors.array().map((value) => {
                const field = (value as unknown as { path: string }).path;
                Logger.Of('routesInputValidation').error(`field: ${field} msg: ${value.msg}`);
                return {
                    errorCode: convertErrorNameToErrorCode(field),
                };
            }),
        );

        res.status(400).json(responseBuilder.build());
    };
}

const convertErrorNameToErrorCode = (path: string): ErrorCode => {
    switch (path) {
        case 'locale':
            return ErrorCode.LOCALE_INVALID;
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
