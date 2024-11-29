import { NextFunction, Request, Response } from 'express';
import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { ErrorCode } from 'types/ErrorCode';
import { HttpCode } from 'types/HttpCode';
import { ResponseStatusType } from 'types/ResponseStatusType';

export const sanitizeRequestBody = (allowedFields: string[]) => (req: Request, res: Response, next: NextFunction) => {
    const extraFields = Object.keys(req.body).filter((key) => !allowedFields.includes(key));
    if (extraFields.length > 0) {
        Logger.Of('sanitizeRequestBody').info(`Unexpected fields: ${extraFields.join(', ')}`);
        return res.status(HttpCode.BAD_REQUEST).json(
            new ResponseBuilder()
                .setStatus(ResponseStatusType.INTERNAL)
                .setError({
                    errorCode: ErrorCode.UNEXPECTED_PROPERTY,
                })
                .build(),
        );
    }

    next();
};
