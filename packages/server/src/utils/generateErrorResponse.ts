import { ErrorCode, HttpCode, ResponseStatusType } from '@tenpercent/shared';
import { Response } from 'express';

import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';

import { BaseError } from './errors/BaseError';

export function generateErrorResponse(
    res: Response,
    responseBuilder: ResponseBuilder,
    error: BaseError,
    defaultErrorCode: ErrorCode,
) {
    const statusCode =
        error instanceof BaseError ? (error?.getStatusCode() ?? HttpCode.INTERNAL_SERVER_ERROR) : HttpCode.INTERNAL_SERVER_ERROR;
    const errorCode = error instanceof BaseError ? (error.getErrorCode() ?? defaultErrorCode) : defaultErrorCode;
    const payload = error instanceof BaseError ? (error?.getPayload() ?? undefined) : undefined;
    if (statusCode === HttpCode.NO_CONTENT) {
        return res.status(HttpCode.NO_CONTENT).end();
    } else {
        return res
            .status(statusCode)
            .json(responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode, payload }).build())
            .end();
    }
}
