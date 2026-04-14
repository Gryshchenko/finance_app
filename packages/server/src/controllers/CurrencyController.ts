import { Request, Response } from 'express';
import { ErrorCode, Utils, HttpCode, ResponseStatusType } from 'tenpercent/shared';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import CurrencyServiceBuilder from 'services/currency/CurrencyServiceBuilder';
import { BaseError } from 'src/utils/errors/BaseError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';

export class CurrencyController {
    private static readonly logger = Logger.Of('CurrencyController');
    public static async gets(_: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const response = await CurrencyServiceBuilder.build().gets();
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(response).build());
        } catch (e: unknown) {
            CurrencyController.logger.error(`Get currency failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.CURRENCY_ERROR);
        }
    }
    public static async get(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const currency: string = String(req.query.currency) as string;
            if (Utils.isEmpty(currency)) {
                throw new ValidationError({
                    message: `Get currency failed currency should not be empty`,
                });
            }
            const response = await CurrencyServiceBuilder.build().getByCurrencyCode(currency);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(response).build());
        } catch (e: unknown) {
            CurrencyController.logger.error(`Get currency failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.CURRENCY_ERROR);
        }
    }
}
