import { NextFunction, Request, Response } from 'express';
import { body, ValidationChain, validationResult } from 'express-validator';
import { HttpCode, ResponseStatusType } from 'tenpercent/shared';
import { ErrorCode } from 'tenpercent/shared';
import ResponseBuilder from 'src/helper/responseBuilder/ResponseBuilder';
import Logger from 'helper/logger/Logger';

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

    if (type === 'date') {
        validatorChain = validatorChain.isISO8601().custom((value) => {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                throw new Error(`Field ${field} must be a valid date`);
            }
            return true;
        });
    }
    if (type === 'email') {
        validatorChain = validatorChain.isEmail().withMessage(`Field ${field} must be a valid email address`);
    } else if (type === 'password') {
        validatorChain = validatorChain.isStrongPassword().withMessage(`Field ${field} must be a strong password`);
    } else if (type === 'number') {
        const numMin = options.min ?? Number.MIN_SAFE_INTEGER;
        const numMax = options.max ?? Number.MAX_SAFE_INTEGER;
        validatorChain = validatorChain
            .isNumeric()
            .withMessage(`Field ${field} must be a numeric value`)
            .bail()
            .isFloat({ min: numMin, max: numMax })
            .withMessage(`Field ${field} must be a number between ${numMin} and ${numMax}`);
    } else if (type === 'string') {
        validatorChain = validatorChain.isString().withMessage(`Field ${field} must be a string`).bail();
        if (field === 'locale') {
            validatorChain = validatorChain
                .matches(/^[a-zA-Z]{2}-[a-zA-Z]{2}$/, 'i')
                .withMessage(`Field ${field} must be in locale format (e.g., en-US)`);
        }
    }

    if (options.max && type !== 'number') {
        validatorChain = validatorChain
            .isLength({ max: options.max })
            .withMessage(`Field ${field} must not exceed ${options.max} characters`);
    }

    if (options.min && type !== 'number') {
        validatorChain = validatorChain
            .isLength({ min: options.min })
            .withMessage(`Field ${field} must be at least ${options.min} characters long`);
    }

    return [validatorChain];
}

export default function routesInputValidation(
    validations: ValidationChain[],
    converter: (path: string) => ErrorCode = convertErrorNameToErrorCode,
) {
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
                    errorCode: converter(field),
                    msg: value.msg,
                    payload: {
                        field,
                        reason: 'invalid',
                    },
                };
            }),
        );

        res.status(HttpCode.BAD_REQUEST).json(responseBuilder.build());
    };
}

export const convertErrorNameToErrorCode = (path: string): ErrorCode => {
    switch (path) {
        case 'token':
            return ErrorCode.TOKEN_LONG_INVALID_ERROR;
        case 'profileId':
            return ErrorCode.PROFILE_ERROR;
        case 'locale':
            return ErrorCode.LOCALE_INVALID_ERROR;
        case 'code':
            return ErrorCode.EMAIL_CONFIRMATION_ERROR;
        case 'email':
            return ErrorCode.EMAIL_INVALID_ERROR;
        case 'password':
        case 'newPassword':
            return ErrorCode.PASSWORD_INVALID_ERROR;
        default:
            return ErrorCode.UNKNOWN_ERROR;
    }
};
