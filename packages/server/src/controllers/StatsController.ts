import { Request, Response } from 'express';
import { ErrorCode, StatsPeriod, HttpCode, ResponseStatusType, StatsType } from 'tenpercent/shared';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { StatsOrchestratorServiceBuilder } from 'services/StatsOrchestrator/StatsOrchestratorServiceBuilder';
import { BaseError } from 'src/utils/errors/BaseError';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';

export class StatsController {
    private static readonly logger = Logger.Of('StatsController');
    public static async summary(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const from = String(req.query?.from);
            const to = String(req.query?.to);
            const period = String(req.query?.period) as StatsPeriod;
            const category = await StatsOrchestratorServiceBuilder.build().summary(req.user?.userId as number, from, to, period);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(category).build());
        } catch (e: unknown) {
            StatsController.logger.error(`Get summary failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.STATS_ERROR);
        }
    }
    public static async entityStats(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const entityId = Number(req.params?.entityId);
            const from = String(req.query?.from);
            const to = String(req.query?.to);
            const type = String(req.query?.type) as StatsType;
            const entityStats = await StatsOrchestratorServiceBuilder.build().entityStats(
                req.user?.userId as number,
                type,
                entityId,
                from,
                to,
            );
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(entityStats).build());
        } catch (e: unknown) {
            StatsController.logger.error(`Get entityStats failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.STATS_ERROR);
        }
    }
}
