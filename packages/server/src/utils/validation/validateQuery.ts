import { HttpCode, ResponseStatusType, ErrorCode, Utils, Time } from '@tenpercent/shared';
import { NextFunction, Request, Response } from 'express';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { IQueryParamSpec, QueryParamType, QuerySchema, QUERY_LIMITS } from 'src/utils/validation/querySchema';

/** `Number()` accepts `''`, `' '`, `0x10`, `1e3` and `Infinity`; the query string may not. */
const INTEGER_PATTERN = /^[+-]?\d+$/;
const NUMBER_PATTERN = /^[+-]?\d*\.?\d+$/;

const normalizeSpec = (spec: string | IQueryParamSpec): IQueryParamSpec => {
    if (typeof spec !== 'string') {
        return spec;
    }
    return { type: spec.replace('?', '') as QueryParamType, optional: spec.includes('?') };
};

/**
 * Validates and normalises the query string against a schema.
 *
 * Two things happen here that a caller can rely on:
 *
 *  - a parameter that is present is within the bounds its spec declares, so a controller
 *    reading `Number(req.query.limit)` cannot receive `100000000`, `-1` or `0.5`;
 *  - a parameter that is absent but has a `default` is written into `req.query`, so a
 *    controller reads the same shape either way.
 *
 * Anything the schema does not declare is rejected, including inherited `Object.prototype`
 * keys - `?constructor=1` used to slip through the unexpected-parameter check because
 * `schema['constructor']` is truthy on any object literal.
 */
const validateQuery = (schema: QuerySchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const errors: string[] = [];

        Object.keys(req.query).forEach((key) => {
            if (!Object.prototype.hasOwnProperty.call(schema, key)) {
                errors.push(`Unexpected query parameter: ${key}`);
            }
        });

        Object.keys(schema).forEach((key) => {
            const spec = normalizeSpec(schema[key]);
            const raw = req.query[key];

            // `qs` turns `?a=1&a=2` into an array and `?a[b]=1` into an object. Every
            // parameter we declare is scalar, so a non-string is rejected before anything
            // stringifies it into `'[object Object]'` or a comma-joined list.
            if (Utils.isNotNull(raw) && typeof raw !== 'string') {
                errors.push(`Invalid type for ${key}: expected a single value`);
                return;
            }

            const value = raw as string | undefined;
            const isAbsent = Utils.isNull(value) || value === '';

            if (isAbsent) {
                if (spec.default !== undefined) {
                    req.query[key] = String(spec.default);
                    return;
                }
                if (!spec.optional) {
                    errors.push(`Missing query parameter: ${key}`);
                }
                return;
            }

            if (spec.type === 'integer' || spec.type === 'number') {
                const pattern = spec.type === 'integer' ? INTEGER_PATTERN : NUMBER_PATTERN;
                if (!pattern.test(value)) {
                    errors.push(`Invalid type for ${key}: expected ${spec.type} value: ${value}`);
                    return;
                }
                const numValue = Number(value);
                const min = spec.min ?? Number.MIN_SAFE_INTEGER;
                const max = spec.max ?? Number.MAX_SAFE_INTEGER;
                if (!Number.isFinite(numValue) || numValue < min || numValue > max) {
                    errors.push(`Invalid value for ${key}: expected number between ${min} and ${max}, value: ${value}`);
                    return;
                }
                req.query[key] = String(numValue);
                return;
            }

            if (spec.type === 'string') {
                const maxLength = spec.maxLength ?? QUERY_LIMITS.MAX_STRING_LENGTH;
                if (value.length > maxLength) {
                    errors.push(`Invalid value for ${key}: expected at most ${maxLength} characters`);
                    return;
                }
                if (spec.allowedValues && !spec.allowedValues.includes(value)) {
                    errors.push(`Invalid value for ${key}: expected one of ${spec.allowedValues.join(', ')}`);
                }
                return;
            }

            if (spec.type === 'date') {
                try {
                    Time.parseUTC(value);
                } catch {
                    errors.push(`Invalid type for ${key}: expected valid date string`);
                }
            }
        });

        if (errors.length) {
            Logger.Of('validateQuery').error(`Validate query failed due reason`, { errors });
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
