import { ErrorCode, HttpCode, ResponseStatusType } from '@tenpercent/shared';
import { Request, Response } from 'express';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import GoalSelectionServiceBuilder from 'services/goalSelectionService/GoalSelectionServiceBuilder';
import { BaseError } from 'src/utils/errors/BaseError';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';

export class GoalSelectionController {
    private static readonly logger = Logger.Of('GoalSelectionController');

    public static async get(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userId = Number(req.user?.userId);
            const selectedGoals = await GoalSelectionServiceBuilder.build().get(userId);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({ selectedGoals }).build());
        } catch (e: unknown) {
            GoalSelectionController.logger.error(`Goal selection fetch failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.TUTORIAL_ERROR);
        }
    }

    public static async post(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userId = Number(req.user?.userId);
            const keys = ((req.body?.selectedGoals as string[]) ?? []).map((goal: string) => String(goal).slice(0, 100));

            const tutorials = await GoalSelectionServiceBuilder.build().post(userId, keys);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(tutorials).build());
        } catch (e: unknown) {
            GoalSelectionController.logger.error(`Goal selection failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.TUTORIAL_ERROR);
        }
    }
}
