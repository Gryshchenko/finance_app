import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { Response } from 'express';
import { ErrorCode } from 'types/ErrorCode';
import { HttpCode } from 'types/HttpCode';
import { ResponseStatusType } from 'types/ResponseStatusType';

export function generateErrorResponse(
    res: Response,
    responseBuilder: ResponseBuilder,
    error: { statusCode: HttpCode },
    errorCode: ErrorCode,
) {
    const statusCode = error?.statusCode ?? HttpCode.INTERNAL_SERVER_ERROR;
    return res.status(statusCode).json(responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode }).build());
}
