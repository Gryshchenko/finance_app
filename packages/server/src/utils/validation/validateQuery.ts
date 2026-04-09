import { NextFunction, Request, Response } from 'express';
import { HttpCode } from 'tenpercent/shared';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { ResponseStatusType } from 'tenpercent/shared';
import { ErrorCode } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';
import Logger from 'helper/logger/Logger';
import { Time } from 'tenpercent/shared';

const validateQuery = (schema: Record<string, string>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const errors: string[] = [];
        Object.keys(req.query).forEach((key) => {
            if (!schema[key]) {
                errors.push(`Unexpected query parameter: ${key}`);
            }
        });

        Object.keys(schema).forEach((key) => {
            if (!Object.prototype.hasOwnProperty.call(schema, key)) {
                return;
            }
            const expectedType = schema[key].replace('?', '');
            const isOptional = schema[key].includes('?');
            const value = req.query[key];

            if (Utils.isNull(value) && !isOptional) {
                errors.push(`Missing query parameter: ${key}`);
                return;
            }
            if (expectedType === 'number' && Utils.isNotNull(value)) {
                const numValue = Number(value);
                if (isNaN(numValue) || numValue < Number.MIN_SAFE_INTEGER || numValue > Number.MAX_SAFE_INTEGER) {
                    errors.push(`Invalid type for ${key}: expected number in range value: ${value}`);
                }
            }

            if (
                expectedType === 'string' &&
                typeof value !== 'string' &&
                (String(value).length <= 0 || String(value).length >= 500)
            ) {
                errors.push(`Invalid type for ${key}: expected string`);
            }
            if (expectedType === 'date') {
                try {
                    Time.parseUTC(String(value));
                } catch {
                    errors.push(`Invalid type for ${key}: expected valid date string`);
                }
            }
        });
        if (errors.length) {
            Logger.Of('validateQuery').error(`Validate query failed due reason`, errors);
            return res.status(HttpCode.BAD_REQUEST).json(
                new ResponseBuilder()
                    .setStatus(ResponseStatusType.INTERNAL)
                    .setErrors(
                        errors.map((str) => ({
                            errorCode: ErrorCode.UNEXPECTED_PROPERTY,
                            message: str,
                        })),
                    )
                    .build(),
            );
        }

        next();
    };
};

export { validateQuery };
