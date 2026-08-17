import { ErrorCode, HttpCode, ResponseStatusType, Time, Utils } from '@tenpercent/shared';
import { NextFunction, Request, Response } from 'express';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { FieldSchema, FIELD_LIMITS, IFieldSpec, normalizeSpec } from 'src/utils/validation/fieldRules';
import { convertErrorNameToErrorCode, convertFieldToReason } from 'src/utils/validation/routesInputValidation';

interface IFieldError {
    field: string;
    message: string;
}

const listUnexpectedFields = (body: Record<string, unknown>, schema: FieldSchema, prefix = ''): string[] =>
    Object.keys(body)
        .filter((key) => !Object.prototype.hasOwnProperty.call(schema, key))
        .map((key) => `${prefix}${key}`);

/**
 * Checks one value against its spec. Body values arrive as parsed JSON, so the check is
 * strict: `"100"` is not a number and `1` is not a boolean. Coercion belongs to the query
 * string, where everything is a string by construction.
 */
const checkValue = (path: string, value: unknown, spec: IFieldSpec, errors: IFieldError[]): void => {
    const fail = (message: string) => errors.push({ field: path, message });

    switch (spec.type) {
        case 'integer':
        case 'number': {
            if (typeof value !== 'number' || !Number.isFinite(value)) {
                fail(`Field ${path} must be a ${spec.type}`);
                return;
            }
            if (spec.type === 'integer' && !Number.isInteger(value)) {
                fail(`Field ${path} must be a whole number`);
                return;
            }
            const min = spec.min ?? Number.MIN_SAFE_INTEGER;
            const max = spec.max ?? Number.MAX_SAFE_INTEGER;
            if (value < min || value > max) {
                fail(`Field ${path} must be between ${min} and ${max}`);
                return;
            }
            if (spec.gt !== undefined && value <= spec.gt) {
                fail(`Field ${path} must be greater than ${spec.gt}`);
                return;
            }
            if (spec.allowedValues && !spec.allowedValues.includes(value)) {
                fail(`Field ${path} must be one of the supported values`);
            }
            return;
        }
        case 'string': {
            if (typeof value !== 'string') {
                fail(`Field ${path} must be a string`);
                return;
            }
            const minLength = spec.minLength ?? 1;
            const maxLength = spec.maxLength ?? FIELD_LIMITS.MAX_STRING_LENGTH;
            if (value.length < minLength || value.length > maxLength) {
                fail(`Field ${path} must be between ${minLength} and ${maxLength} characters`);
                return;
            }
            if (spec.allowedValues && !spec.allowedValues.includes(value)) {
                fail(`Field ${path} must be one of the supported values`);
                return;
            }
            if (spec.pattern && !spec.pattern.test(value)) {
                fail(`Field ${path} has an unexpected format`);
            }
            return;
        }
        case 'boolean': {
            if (typeof value !== 'boolean') {
                fail(`Field ${path} must be a boolean`);
            }
            return;
        }
        case 'date': {
            if (typeof value !== 'string') {
                fail(`Field ${path} must be an ISO date string`);
                return;
            }
            if (value.length > (spec.maxLength ?? FIELD_LIMITS.MAX_STRING_LENGTH)) {
                fail(`Field ${path} must be an ISO date string`);
                return;
            }
            try {
                Time.parseUTC(value);
            } catch {
                fail(`Field ${path} must be a valid date`);
            }
            return;
        }
        case 'array': {
            if (!Array.isArray(value)) {
                fail(`Field ${path} must be an array`);
                return;
            }
            const minLength = spec.minLength ?? 0;
            const maxLength = spec.maxLength ?? FIELD_LIMITS.MAX_ARRAY_LENGTH;
            if (value.length < minLength || value.length > maxLength) {
                fail(`Field ${path} must hold between ${minLength} and ${maxLength} items`);
                return;
            }
            if (spec.items) {
                value.forEach((item, index) => checkValue(`${path}[${index}]`, item, spec.items as IFieldSpec, errors));
            }
            return;
        }
        case 'object': {
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                fail(`Field ${path} must be an object`);
                return;
            }
            const properties = spec.properties ?? {};
            const nested = value as Record<string, unknown>;
            const unexpected = listUnexpectedFields(nested, properties);
            if (unexpected.length) {
                fail(`Field ${path} has unexpected properties: ${unexpected.join(', ')}`);
                return;
            }
            Object.keys(properties).forEach((key) => {
                // eslint-disable-next-line security/detect-object-injection
                checkField(`${path}.${key}`, nested[key], properties[key], errors);
            });
        }
    }
};

const checkField = (path: string, value: unknown, spec: IFieldSpec, errors: IFieldError[]): void => {
    // An explicit `null` counts as absent, matching how the controllers read the body
    // (`Utils.isNull`) and how express-validator's `optional({ nullable: true })` behaves.
    if (Utils.isNull(value)) {
        if (!spec.optional) {
            errors.push({ field: path, message: `Field ${path} is required` });
        }
        return;
    }
    checkValue(path, value, spec, errors);
};

/**
 * Closes the request body to exactly what a route declares.
 *
 * A body used to be described by a list of allowed field names, which stopped an unknown
 * field but said nothing about the ones that were allowed: `keepData` could be an object,
 * `selectedGoals` could be a megabyte of arbitrary strings, and the express-validator
 * `'boolean'` type was silently a no-op. The schema form makes every accepted field carry
 * a type and a bound, and it rejects anything else - including unknown properties nested
 * inside an object.
 *
 * The deeper semantic rules (password strength, deliverable email, cross-field transaction
 * rules, "is this currency in the currencies table") stay in `routesInputValidation`, which
 * runs after this and owns the domain error codes. `converter` maps a field name to the
 * error code this middleware should report, and is the same converter the route already
 * passes to `routesInputValidation`, so a rejection carries the same code either way.
 */
export const sanitizeRequestBody =
    (schema: FieldSchema, converter: (path: string) => ErrorCode = convertErrorNameToErrorCode) =>
    (req: Request, res: Response, next: NextFunction) => {
        const body = (req.body ?? {}) as Record<string, unknown>;

        const extraFields = listUnexpectedFields(body, schema);
        if (extraFields.length > 0) {
            Logger.Of('sanitizeRequestBody').info(`Unexpected fields: ${extraFields.join(', ')}`);
            return res.status(HttpCode.BAD_REQUEST).json(
                new ResponseBuilder()
                    .setStatus(ResponseStatusType.INTERNAL)
                    .setError({
                        errorCode: ErrorCode.UNEXPECTED_PROPERTY,
                        payload: {
                            fields: extraFields.join(','),
                        },
                    })
                    .build(),
            );
        }

        const errors: IFieldError[] = [];
        Object.keys(schema).forEach((key) => {
            // eslint-disable-next-line security/detect-object-injection
            checkField(key, body[key], normalizeSpec(schema[key]), errors);
        });

        if (errors.length > 0) {
            Logger.Of('sanitizeRequestBody').error('Validate body failed due reason', {
                errors: errors.map((error) => error.message),
            });
            return res.status(HttpCode.BAD_REQUEST).json(
                new ResponseBuilder()
                    .setStatus(ResponseStatusType.INTERNAL)
                    .setErrors(
                        errors.map((error) => ({
                            errorCode: converter(error.field),
                            msg: error.message,
                            payload: {
                                field: error.field,
                                reason: convertFieldToReason(error.field),
                            },
                        })),
                    )
                    .build(),
            );
        }

        next();
    };
