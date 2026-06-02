import { IBalance, Utils, HttpCode, ErrorCode } from 'tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IAccountService } from 'services/account/AccountService';
import { ICurrencyService } from 'services/currency/CurrencyService';
import { IExchangeRateService } from 'services/exchangeRateService/ExchangeRateService';
import { IProfileService } from 'services/profile/ProfileService';
import { CustomError } from 'src/utils/errors/CustomError';

export interface IBalanceService {
    get(userId: number): Promise<IBalance>;
}

export default class BalanceService extends LoggerBase implements IBalanceService {
    private readonly _profileService: IProfileService;
    private readonly _exchangeRateService: IExchangeRateService;
    private readonly _currencyService: ICurrencyService;
    private readonly _accountService: IAccountService;

    public constructor(
        profileService: IProfileService,
        exchangeRateService: IExchangeRateService,
        currencyService: ICurrencyService,
        accountService: IAccountService,
    ) {
        super();
        this._profileService = profileService;
        this._exchangeRateService = exchangeRateService;
        this._currencyService = currencyService;
        this._accountService = accountService;
    }
    async get(userId: number): Promise<IBalance> {
        const accounts = await this._accountService.getAccounts(userId);
        const user = await this._profileService.get(userId);
        if (!user) {
            throw this.error(`User currency not found for userId: ${userId}`);
        }
        const currencySymbolForCurrentUser = await this._currencyService.getById(user.currencyId);
        if (!currencySymbolForCurrentUser?.symbol) {
            throw this.error(`Currency symbol not found for currencyId: ${user.currencyId}`);
        }
        const accountWithSameCurrency = accounts?.filter((acc) => acc.currencyId === user.currencyId);
        const accountWithDiffCurrency = accounts?.filter((acc) => acc.currencyId !== user.currencyId);
        let sum = 0;

        if (Utils.isArrayNotEmpty(accountWithDiffCurrency)) {
            const numbers = await Promise.all(
                accountWithDiffCurrency?.map(async (account) => {
                    const currencySymbolForAccount = await this._currencyService.getById(account.currencyId);
                    if (!currencySymbolForAccount?.currencyCode) {
                        throw this.error(`Currency symbol not found for account currencyId: ${account.currencyId}`);
                    }
                    const rate = await this._exchangeRateService.get(
                        currencySymbolForCurrentUser.currencyCode,
                        currencySymbolForAccount.currencyCode,
                    );
                    if (!rate) {
                        throw this.error(
                            `Rates not found for symbols: ${currencySymbolForCurrentUser.currencyCode}, ${currencySymbolForAccount.currencyCode}`,
                        );
                    }
                    return account.amount * rate.rate;
                }),
            );
            if (Utils.isArrayNotEmpty(numbers)) {
                sum += numbers.reduce((acc: number, curr): number => {
                    return acc + curr;
                });
            }
        }

        if (Utils.isArrayNotEmpty(accountWithSameCurrency)) {
            sum += accountWithSameCurrency?.reduce((acc: number, curr): number => {
                return curr.amount + acc;
            }, 0);
        }
        return {
            balance: sum,
        };
    }
    private error(msg: string): CustomError {
        this._logger.error(msg);
        return new CustomError({
            message: msg,
            statusCode: HttpCode.INTERNAL_SERVER_ERROR,
            errorCode: ErrorCode.PROFILE_ERROR,
        });
    }
}
