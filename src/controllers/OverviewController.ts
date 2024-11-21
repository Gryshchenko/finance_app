import { Request, Response } from 'express';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { ResponseStatusType } from 'types/ResponseStatusType';
import { ErrorCode } from 'types/ErrorCode';
import Logger from 'helper/logger/Logger';
import OverviewServiceBuilder from 'services/overview/OverviewServiceBuilder';
import { HttpCode } from 'types/HttpCode';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';
import { BaseError } from 'src/utils/errors/BaseError';

export class OverviewController {
    private static logger = Logger.Of('OverviewController');
    public static async overview(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const response = await OverviewServiceBuilder.build().overview(req.session.user?.userId);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(response).build());
        } catch (e: unknown) {
            OverviewController.logger.error(`Fetch overview failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.OVERVIEW_ERROR);
        }
    }
}
