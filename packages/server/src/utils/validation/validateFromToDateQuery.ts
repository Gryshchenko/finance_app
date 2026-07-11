import { HttpCode, ResponseStatusType, ErrorCode, Time, DateTime } from '@tenpercent/shared';
import { NextFunction, Request, Response } from 'express';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { BaseError } from 'src/utils/errors/BaseError';
import { ValidationError } from 'src/utils/errors/ValidationError';

const validateFromToDateQuery = (schema: Record<string, string>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            let from: DateTime | null = null;
            let to: DateTime | null = null;
            const now = Time.utc();

            if (schema['from']) {
                from = Time.fromUTCISO(String(req.query?.from), true);
                if (from?.toSeconds() > now?.toSeconds()) {
                    throw new ValidationError({
                        message: `"from" should not be greater than current time: ${req.query?.from}`,
                        payload: { reason: 'validation:date', field: 'from' },
                    });
                }
            }

            if (schema['to']) {
                to = Time.fromUTCISO(String(req.query?.to), true);
                if (to?.toSeconds() > now?.toSeconds()) {
                    throw new ValidationError({
                        message: `"to" should not be greater than current time: ${req.query?.to}`,
                        payload: { reason: 'validation:date', field: 'to' },
                    });
                }
            }

            if (from && to && from?.toSeconds() > to?.toSeconds()) {
                throw new ValidationError({
                    message: `"from" should not be greater than "to", from: ${req.query?.from}, to: ${req.query?.to}`,
                });
            }
        } catch (e) {
            const error = e as BaseError;
            Logger.Of('validateFromToDateQuery').error(`Validate query failed due reason`, error.toJSON());
            return res.status(HttpCode.BAD_REQUEST).json(
                new ResponseBuilder()
                    .setStatus(ResponseStatusType.INTERNAL)
                    .setError({
                        errorCode: ErrorCode.UNEXPECTED_PROPERTY,
                        msg: error.message,
                        payload: error?.getPayload(),
                    })
                    .build(),
            );
        }
        next();
    };
};

export { validateFromToDateQuery };
