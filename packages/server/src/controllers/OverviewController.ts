import { ResponseStatusType, ErrorCode, HttpCode } from '@tenpercent/shared';
import { Request, Response } from 'express';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import OverviewServiceBuilder from 'services/overview/OverviewServiceBuilder';
import { BaseError } from 'src/utils/errors/BaseError';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';

export class OverviewController {
    private static readonly logger = Logger.Of('OverviewController');
    public static async overview(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const response = await OverviewServiceBuilder.build().overview(req.user?.userId);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(response).build());
        } catch (e: unknown) {
            OverviewController.logger.error(`Fetch overview failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.OVERVIEW_ERROR);
        }
    }
}
