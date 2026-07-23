import { ErrorCode, HttpCode, ITutorialRequest, ResponseStatusType } from '@tenpercent/shared';
import { Request, Response } from 'express';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import TutorialServiceBuilder from 'services/tutorial/TutorialServiceBuilder';
import { BaseError } from 'src/utils/errors/BaseError';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';

const TUTORIAL_FLAGS = [
    'isOnBoardingTutorialView',
    'isAccountTutorialView',
    'isDashboardTutorialView',
    'isBalanceInsightsTutorialView',
    'isIncomeTutorialView',
    'isSharingTutorialView',
    'isCategoryTutorialView',
] as const;

export class TutorialController {
    private static readonly logger = Logger.Of('TutorialController');

    public static async get(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userId = Number(req.user?.userId);
            const tutorials = await TutorialServiceBuilder.build().get(userId);
            res.status(HttpCode.OK).json(
                responseBuilder
                    .setStatus(ResponseStatusType.OK)
                    .setData(tutorials ?? null)
                    .build(),
            );
        } catch (e: unknown) {
            TutorialController.logger.error(`Tutorial fetch failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.TUTORIAL_ERROR);
        }
    }

    public static async patch(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userId = Number(req.user?.userId);

            const payload: ITutorialRequest = {};
            for (const flag of TUTORIAL_FLAGS) {
                if (req.body[flag] !== undefined) payload[flag] = Boolean(req.body[flag]);
            }
            if (req.body.onBoardingViewedSlidesCount !== undefined) {
                payload.onBoardingViewedSlidesCount = Number(req.body.onBoardingViewedSlidesCount);
            }

            const tutorials = await TutorialServiceBuilder.build().patch(userId, payload);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(tutorials).build());
        } catch (e: unknown) {
            TutorialController.logger.error(`Tutorial failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.TUTORIAL_ERROR);
        }
    }
}
