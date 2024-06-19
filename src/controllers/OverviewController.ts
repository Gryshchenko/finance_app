import { Request, Response } from 'express';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { ResponseStatusType } from 'types/ResponseStatusType';
import { ErrorCode } from 'types/ErrorCode';
import Logger from 'helper/logger/Logger';
import OverviewServiceBuilder from 'services/overview/OverviewServiceBuilder';
import Success from 'src/utils/success/Success';
import { IFailure } from 'interfaces/IFailure';

export class OverviewController {
    private static logger = Logger.Of('OverviewController');
    public static async overview(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            console.log(req.session.user);
            const response = await OverviewServiceBuilder.build().overview(req.session.user?.userId);
            if (response instanceof Success) {
                res.status(200).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(response.value).build());
            } else {
                const error = response as IFailure;
                throw new Error(error.error);
            }
        } catch (error) {
            OverviewController.logger.error(error);
            res.status(400).json(
                responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.OVERVIEW_ERROR }).build(),
            );
        }
    }
}
