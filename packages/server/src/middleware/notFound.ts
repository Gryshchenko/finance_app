import { ErrorCode, HttpCode, ResponseStatusType } from '@tenpercent/shared';
import { NextFunction, Request, Response } from 'express';

import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';

/**
 * Terminal route. Without it Express answers an unmatched path with its own HTML page,
 * which no client can parse and which leaks the framework's default error markup.
 * Mounted after every router and before `errorHandler`.
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next();
    res.status(HttpCode.NOT_FOUND).json(
        new ResponseBuilder()
            .setStatus(ResponseStatusType.INTERNAL)
            .setError({ errorCode: ErrorCode.ROUTE_NOT_FOUND_ERROR })
            .build(),
    );
};
