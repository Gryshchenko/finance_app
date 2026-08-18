import { ErrorCode, HttpCode, ResponseStatusType } from '@tenpercent/shared';
import { NextFunction, Request, Response } from 'express';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { BaseError } from 'src/utils/errors/BaseError';

const logger = Logger.Of('ErrorHandler');

interface IBodyParserError extends Error {
    type?: string;
    status?: number;
}

/**
 * A malformed JSON body or an oversized payload is rejected by `express.json()` itself,
 * before any controller runs, so it can only be answered here.
 */
const translateBodyParserError = (error: IBodyParserError): { statusCode: HttpCode; errorCode: ErrorCode } | undefined => {
    if (error.type === 'entity.too.large') {
        return { statusCode: HttpCode.UNPROCESSABLE_ENTITY, errorCode: ErrorCode.MALFORMED_BODY_ERROR };
    }
    if (error instanceof SyntaxError && typeof error.status === 'number' && error.status === HttpCode.BAD_REQUEST) {
        return { statusCode: HttpCode.BAD_REQUEST, errorCode: ErrorCode.MALFORMED_BODY_ERROR };
    }
    return undefined;
};

/**
 * Last middleware in the stack. Everything reaching it is either a `BaseError` a controller
 * chose to delegate, or an unexpected throw - in both cases the client gets the response
 * envelope it expects and never the exception message or stack.
 *
 * Express 4 does not forward rejections from async handlers, so this is a net for
 * synchronous throws and explicit `next(error)` calls, not a substitute for the
 * try/catch each controller already has.
 */
export const errorHandler = (error: unknown, req: Request, res: Response, next: NextFunction) => {
    const isKnown = error instanceof BaseError;
    const bodyParserError = error instanceof Error ? translateBodyParserError(error) : undefined;

    const statusCode = isKnown
        ? (error.getStatusCode() ?? HttpCode.INTERNAL_SERVER_ERROR)
        : (bodyParserError?.statusCode ?? HttpCode.INTERNAL_SERVER_ERROR);
    const errorCode = isKnown
        ? (error.getErrorCode() ?? ErrorCode.INTERNAL_SERVER_ERROR)
        : (bodyParserError?.errorCode ?? ErrorCode.INTERNAL_SERVER_ERROR);
    // Only a `BaseError` carries a payload that was written for the client; anything else is internal.
    const payload = isKnown ? error.getPayload() : undefined;

    logger.error(`Unhandled error on ${req.method} ${req.path}`, {
        statusCode,
        errorCode,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        stack: error instanceof Error ? error.stack : undefined,
    });

    // The response was already started - the only correct move is to let Express abort the socket.
    if (res.headersSent) return next(error);

    res.status(statusCode).json(
        new ResponseBuilder().setStatus(ResponseStatusType.INTERNAL).setError({ errorCode, payload }).build(),
    );
};
