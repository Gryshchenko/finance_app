import { ErrorCode, HttpCode, ResponseStatusType, StatsScope } from '@tenpercent/shared';
import { Request, Response } from 'express';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import BalanceServiceBuilder from 'services/balance/BalanceServiceBuilder';
import { BaseError } from 'src/utils/errors/BaseError';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';
import { parseStatsScope } from 'src/utils/validation/parseStatsScope';

export class BalanceController {
    private static readonly logger = Logger.Of('BalanceController');
    public static async get(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userId = Number(req.user?.userId);
            const scope = parseStatsScope(req.query?.scope, StatsScope.Own);
            const balance = await BalanceServiceBuilder.build().get(userId, scope);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(balance).build());
        } catch (e: unknown) {
            BalanceController.logger.error(`Convert failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
}
