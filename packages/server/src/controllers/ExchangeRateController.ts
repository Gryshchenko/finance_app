import { Request, Response } from 'express';
import { ErrorCode, HttpCode, ResponseStatusType, Utils } from 'tenpercent/shared';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { CurrencyOrchestratorServiceBuilder } from 'services/currencyOrchestrator/CurrencyOrchestratorServiceBuilder';
import { BaseError } from 'src/utils/errors/BaseError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';

export class ExchangeRateController {
    private static readonly logger = Logger.Of('ExchangeRateController');
    public static async get(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const currency: string = String(req.query.currency) as string;
            const targetCurrency: string = String(req.query.targetCurrency) as string;
            // date is optional: when absent let the service default to "today" (current rate),
            // rather than forwarding the literal string "undefined".
            const date: string | undefined = Utils.isNotNull(req.query.date) ? String(req.query.date) : undefined;
            if (Utils.isEmpty(currency) || Utils.isEmpty(targetCurrency)) {
                throw new ValidationError({
                    message: `Conversation failed currency: ${currency} or target currency should not be empty: ${targetCurrency}`,
                });
            }
            const rate = await CurrencyOrchestratorServiceBuilder.build().get(currency, targetCurrency, date);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(rate).build());
        } catch (e: unknown) {
            ExchangeRateController.logger.error(`Convert failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
}
