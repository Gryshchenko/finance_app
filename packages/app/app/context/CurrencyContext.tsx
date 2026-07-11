import { createContext, FC, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { ICurrency, IProfileClient, Utils } from '@tenpercent/shared';

import { useAppQuery } from '@/hooks/useAppQuery';
import { fetchProfile } from '@/hooks/useSettingsProfile';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { CurrencyService } from '@/services/CurrencyService';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { ValidationError } from '@/utils/errors/ValidationError';
import { Logger } from '@/utils/logger/Logger';

export interface CurrencyContextType {
    getCurrency: (currencyCode: string) => ICurrency | undefined;
    getCurrencySymbol: (currencyCode: string) => string;
    defaultCurrency: string;
    defaultCurrencyCode: string;
    currencies: Map<string, ICurrency>;
    isLoading: boolean;
    isError: boolean;
}

export const fetchCurrencies = async (): Promise<ICurrency[] | undefined> => {
    try {
        const currencyService = new CurrencyService();
        const response = await currencyService.doGetCurrencies();
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as ICurrency[];
            }
            case GeneralApiProblemKind.BadData:
            case GeneralApiProblemKind.Unauthorized:
            case GeneralApiProblemKind.Forbidden: {
                throw new ValidationError({
                    message: JSON.stringify(response.errors),
                });
            }
            default: {
                buildGeneralApiBaseHandler(response);
                return undefined;
            }
        }
    } catch (e) {
        _logger.error('Currency context failed due reason: ', (e as { message: string }).message);
        return undefined;
    }
};

export const CurrencyContext = createContext<CurrencyContextType | null>(null);

export interface CurrencyProviderProps {}

const _logger = Logger.Of('CurrencyContext');

export const CurrencyProvider: FC<PropsWithChildren<CurrencyProviderProps>> = ({ children }) => {
    const { data, isLoading, isError } = useAppQuery<ICurrency[] | undefined>(QueryKeys.currencies(), fetchCurrencies, {
        staleTime: QueryStaleTimes.static,
    });
    const { data: profile } = useAppQuery<IProfileClient | undefined>(QueryKeys.profile(), fetchProfile, {
        staleTime: QueryStaleTimes.detail,
    });
    const [currencies, setCurrencies] = useState<Map<string, ICurrency>>(new Map());
    const getDefaultCurrency = (): ICurrency => {
        return {
            currencyCode: 'UNK',
            currencyName: 'UNK',
            symbol: 'UNK',
        };
    };
    const getCurrency = (currencyCode: string): ICurrency | undefined => {
        if (Utils.isNull(currencyCode)) return undefined;
        if (!currencies.has(currencyCode)) return getDefaultCurrency();
        return currencies.get(currencyCode);
    };
    const getCurrencySymbol = (currencyCode: string): string => {
        if (Utils.isNull(currencyCode)) return getDefaultCurrency().symbol;
        if (!currencies.has(currencyCode)) return getDefaultCurrency().symbol;
        return currencies.get(currencyCode)?.symbol ?? getDefaultCurrency().symbol;
    };
    const value = {
        getCurrency,
        getCurrencySymbol,
        currencies,
        defaultCurrency: currencies.get(profile?.currencyCode ?? 'UNK')?.currencyCode ?? 'UNK',
        defaultCurrencyCode: profile?.currencyCode ?? 'UNK',
        isLoading,
        isError,
    };

    useEffect(() => {
        if (!data) return;
        const result: Map<string, ICurrency> = new Map();
        data?.forEach((currency) => {
            result.set(currency.currencyCode, currency);
        });
        setCurrencies(result);
    }, [data]);

    return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) throw new Error('useCurrency must be used within an CurrencyProvider');
    return context;
};
