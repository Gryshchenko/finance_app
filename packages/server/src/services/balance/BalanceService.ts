import { IBalance, Utils, HttpCode, ErrorCode, StatsScope } from '@tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IAccountService } from 'services/account/AccountService';
import { ICurrencyService } from 'services/currency/CurrencyService';
import { ICurrencyOrchestratorService } from 'services/currencyOrchestrator/CurrencyOrchestratorService';
import { IProfileService } from 'services/profile/ProfileService';
import { CustomError } from 'src/utils/errors/CustomError';

export interface IBalanceService {
    get(userId: number, scope?: StatsScope): Promise<IBalance>;
}

export default class BalanceService extends LoggerBase implements IBalanceService {
    private readonly _profileService: IProfileService;
    private readonly _currencyOrchestratorService: ICurrencyOrchestratorService;
    private readonly _currencyService: ICurrencyService;
    private readonly _accountService: IAccountService;

    public constructor(
        profileService: IProfileService,
        currencyOrchestratorService: ICurrencyOrchestratorService,
        currencyService: ICurrencyService,
        accountService: IAccountService,
    ) {
        super();
        this._profileService = profileService;
        this._currencyOrchestratorService = currencyOrchestratorService;
        this._currencyService = currencyService;
        this._accountService = accountService;
    }
    async get(userId: number, scope: StatsScope = StatsScope.Own): Promise<IBalance> {
        // Net worth counts only the user's own accounts - accounts shared into a group are
        // visible in lists/stats but must never inflate the owner's balance. Hence the
        // default here is `own`, unlike the stats endpoints which have always answered
        // with own and shared merged.
        //
        // `shared` sums the accounts sitting in the user's groups instead: that is the
        // group's common pot, not anybody's net worth, and every member sees the same
        // number. Label it accordingly in the UI.
        const accounts = await this._accountService.getAccounts(userId, scope);
        const user = await this._profileService.get(userId);
        if (!user) {
            throw this.error(`User currency not found for userId: ${userId}`);
        }
        const currencySymbolForCurrentUser = await this._currencyService.getByCurrencyCode(user.currencyCode);
        if (!currencySymbolForCurrentUser?.symbol) {
            throw this.error(`Currency symbol not found for currencyCode: ${user.currencyCode}`);
        }
        const accountWithSameCurrency = accounts?.filter((acc) => acc.currencyCode === user.currencyCode);
        const accountWithDiffCurrency = accounts?.filter((acc) => acc.currencyCode !== user.currencyCode);
        let sum = 0;

        if (Utils.isArrayNotEmpty(accountWithDiffCurrency)) {
            const numbers = await Promise.all(
                accountWithDiffCurrency?.map(async (account) => {
                    const currencySymbolForAccount = await this._currencyService.getByCurrencyCode(account.currencyCode);
                    if (!currencySymbolForAccount?.currencyCode) {
                        throw this.error(`Currency symbol not found for account currencyCode: ${account.currencyCode}`);
                    }
                    const rate = await this._currencyOrchestratorService.get(
                        currencySymbolForAccount.currencyCode,
                        currencySymbolForCurrentUser.currencyCode,
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
