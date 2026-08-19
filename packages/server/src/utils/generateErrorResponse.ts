import { ErrorCode, HttpCode, ResponseStatusType } from '@tenpercent/shared';
import { Response } from 'express';

import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';

import { captureError } from './captureError';
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

    // Every controller answers a failure through this function, which makes it the one
    // place that sees handled errors. The global errorHandler never does: Express 4 does
    // not forward rejections from async handlers, and the controllers catch their own.
    captureError(error, { errorCode, source: 'controller' });

    if (statusCode === HttpCode.NO_CONTENT) {
        return res.status(HttpCode.NO_CONTENT).end();
    } else {
        return res
            .status(statusCode)
            .json(responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode, payload }).build())
            .end();
    }
}
