import { IBalanceDataAccess } from 'interfaces/IBalanceDataAccess';
import { IBalanceService } from 'interfaces/IBalanceService';
import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IBalance, Utils } from 'tenpercent/shared';
import { IRate } from '../../../../shared/src/interfaces/IRate';
import { CustomError } from 'src/utils/errors/CustomError';
import { HttpCode } from 'tenpercent/shared';
import { ErrorCode } from 'tenpercent/shared';
import { IExchangeRateService } from 'interfaces/IExchangeRateService';
import { ICurrencyService } from 'interfaces/ICurrencyService';
import { IProfileService } from 'services/profile/ProfileService';

export default class BalanceService extends LoggerBase implements IBalanceService {
    private readonly _balanceDataAccess: IBalanceDataAccess;
    private readonly _profileService: IProfileService;
    private readonly _exchangeRateService: IExchangeRateService;
    private readonly _currencyService: ICurrencyService;

    public constructor(
        balanceDataAccess: IBalanceDataAccess,
        profileService: IProfileService,
        exchangeRateService: IExchangeRateService,
        currencyService: ICurrencyService,
    ) {
        super();
        this._balanceDataAccess = balanceDataAccess;
        this._profileService = profileService;
        this._exchangeRateService = exchangeRateService;
        this._currencyService = currencyService;
    }
    async get(userId: number): Promise<IBalance> {
        return await this._balanceDataAccess.get(userId);
    }
    private error(msg: string): CustomError {
        this._logger.error(msg);
        return new CustomError({
            message: msg,
            statusCode: HttpCode.INTERNAL_SERVER_ERROR,
            errorCode: ErrorCode.PROFILE_ERROR,
        });
    }
    async post(userId: number, properties: { amount: number; currencyCode: string }, trx?: IDBTransaction): Promise<number> {
        return await this._balanceDataAccess.post(userId, properties, trx);
    }

    async patch(userId: number, properties: { amount: number; currencyCode: string }, trx?: IDBTransaction): Promise<number> {
        try {
            this._logger.info(`Patch user balance to amount: ${properties.amount} currency: ${properties.currencyCode}`);
            const profile = await this._profileService.get(userId);
            if (Utils.isNull(profile?.currencyId)) {
                throw this.error(`Patch user balance failed, profile currency null`);
            }
            const userCurrency = await this._currencyService.getById(profile?.currencyId as number);
            if (userCurrency?.currencyCode && userCurrency.currencyCode === properties.currencyCode) {
                const result = await this._balanceDataAccess.patch(userId, properties, trx);
                this._logger.info(`Patch user balance success`);
                return result;
            }
            const currency = userCurrency?.currencyCode as unknown as string;
            const response = await this._exchangeRateService.get(currency, properties.currencyCode);
            if (Utils.isNull(response) || Utils.isObjectEmpty(response as unknown as Record<string, unknown>)) {
                throw this.error(`Fetch rate for default currency ${currency} and target currency: ${properties.currencyCode}`);
            }
            const { rate } = response as unknown as IRate;
            const { amount } = properties;
            const result = await this._balanceDataAccess.patch(
                userId,
                {
                    amount: Utils.roundNumber(amount * rate),
                },
                trx,
            );
            this._logger.info(`Patch user balance success amount: ${Utils.roundNumber(amount * rate)}`);
            return result;
        } catch (e) {
            this._logger.error(`Patch balance failed due reason: ${(e as { message: string }).message}`);
            throw e;
        }
    }
}
