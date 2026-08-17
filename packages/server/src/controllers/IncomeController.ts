import { ErrorCode, HttpCode, ResponseStatusType, StatsScope, Utils } from '@tenpercent/shared';
import { Request, Response } from 'express';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { IncomeOrchestrationServiceBuilder } from 'services/income/IncomeOrchestrationServiceBuilder';
import IncomeServiceBuilder from 'services/income/IncomeServiceBuilder';
import { StatsOrchestratorServiceBuilder } from 'services/StatsOrchestrator/StatsOrchestratorServiceBuilder';
import { BaseError } from 'src/utils/errors/BaseError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';
import { parseStatsScope } from 'src/utils/validation/parseStatsScope';

export class IncomeController {
    private static readonly logger = Logger.Of('IncomeController');
    public static async getStats(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const from = String(req.query?.from);
            const to = String(req.query?.to);
            // Same as the summary endpoint: no scope has always meant own + shared.
            const scope = parseStatsScope(req.query?.scope, StatsScope.All);
            const category = await StatsOrchestratorServiceBuilder.build().incomesStats(
                req.user?.userId as number,
                from,
                to,
                scope,
            );
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(category).build());
        } catch (e: unknown) {
            IncomeController.logger.error(`Get income stats failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
    public static async get(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const incomeId = Number(req.params?.incomeId);
            const income = await IncomeServiceBuilder.build().get(req.user?.userId as number, incomeId);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(income).build());
        } catch (e: unknown) {
            IncomeController.logger.error(`Get income failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
    public static async gets(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const income = await IncomeServiceBuilder.build().gets(req.user?.userId as number);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(income).build());
        } catch (e: unknown) {
            IncomeController.logger.error(`Create accounts failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
    public static async post(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const { incomeName, currencyCode, iconId } = req.body;
            const income = await IncomeServiceBuilder.build().create(req.user?.userId as number, {
                incomeName,
                currencyCode,
                iconId,
            });
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(income).build());
        } catch (e: unknown) {
            IncomeController.logger.error(`Create income failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
    public static async delete(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userId = Number(req.user?.userId);
            const keepData = Boolean(req.body?.keepData);
            const incomeId = Number(req.params?.incomeId);
            await IncomeOrchestrationServiceBuilder.build().delete(userId, incomeId, keepData);
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            IncomeController.logger.error(`Delete income failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
    public static async patch(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const incomeId = Number(req.params?.incomeId);
            const { incomeName, status, iconId, colorId, position } = req.body;
            if (
                Utils.isEmpty(incomeName) &&
                Utils.isNull(status) &&
                Utils.isEmpty(iconId) &&
                Utils.isEmpty(colorId) &&
                Utils.isNull(position)
            ) {
                throw new ValidationError({ message: 'Path income failed due reason: empty body' });
            }
            await IncomeServiceBuilder.build().patch(req.user?.userId as number, incomeId, {
                incomeName,
                status,
                iconId,
                colorId,
                position,
            });
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            IncomeController.logger.error(`Patch income failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
}
