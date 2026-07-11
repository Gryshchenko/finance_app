import { ErrorCode, HttpCode, ResponseStatusType } from '@tenpercent/shared';
import { NextFunction, Request, Response } from 'express';

import { getConfig } from 'src/config/config';
import ResponseBuilder from 'src/helper/responseBuilder/ResponseBuilder';

export const checkOriginReferer = (req: Request, res: Response, next: NextFunction) => {
    const trustedOrigin = getConfig().trustedOrigin;
    const origin = req.get('Origin');
    const referer = req.get('Referer');

    if (origin && origin !== trustedOrigin) {
        return res
            .status(HttpCode.FORBIDDEN)
            .send(
                new ResponseBuilder()
                    .setStatus(ResponseStatusType.INTERNAL)
                    .setError({ errorCode: ErrorCode.UNKNOWN_ERROR })
                    .build(),
            );
    }

    if (referer && !referer.startsWith(trustedOrigin)) {
        return res
            .status(HttpCode.FORBIDDEN)
            .send(
                new ResponseBuilder()
                    .setStatus(ResponseStatusType.INTERNAL)
                    .setError({ errorCode: ErrorCode.UNKNOWN_ERROR })
                    .build(),
            );
    }

    next();
};
