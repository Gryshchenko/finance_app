import { FC } from 'react';
import { useNavigation } from '@react-navigation/native';
import { IRate, ITransaction, Time } from 'tenpercent/shared';

import { TransactionFields } from '@/components/transaction/TransactionFields';
import { useCurrency } from '@/context/CurrencyContext';
import { useAppQuery, useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { ITransactionClient } from '@/interfaces/ITransactionClient';
import { buildTransactionCreateSchema } from '@/schems/validationSchemas';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { ExchangeService } from '@/services/ExchangeService';
import { InvalidationGroups, QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { TransactionService } from '@/services/TransactionService';
import { OverviewPath } from '@/types/OverviewPath';
import { Logger } from '@/utils/logger/Logger';

interface IProps {
    data: Partial<ITransactionClient> | undefined;
}

const fetchRates = async (
    sourceCurrencySymbol: string | undefined,
    targetCurrencySymbol: string | undefined,
): Promise<IRate | undefined> => {
    try {
        if (sourceCurrencySymbol === targetCurrencySymbol) return undefined;
        if (!targetCurrencySymbol && !sourceCurrencySymbol) return undefined;
        if (!targetCurrencySymbol || !sourceCurrencySymbol) return undefined;

        const exchangeService = ExchangeService.instance();

        const response = await exchangeService.doGetRateForCurrency(sourceCurrencySymbol, targetCurrencySymbol);
        if (response.kind === GeneralApiProblemKind.Ok) {
            return response.data as IRate;
        } else {
            return undefined;
        }
    } catch (e) {
        Logger.Of('TransactionCreate').error(e);
        return undefined;
    }
};

export const TransactionCreate: FC<IProps> = function TransactionCreate(_props: IProps) {
    const { data } = _props;
    const { getCurrency, defaultCurrencyId } = useCurrency();
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();

    const formInitial = {
        amount: '',
        currencyId: defaultCurrencyId,
        createdAt: Time.getISODateNowUTC(),
        ...data,
    };

    const { form, handleChange, save, errors, setErrors } = useEditView<Partial<ITransactionClient>>(
        formInitial,
        buildTransactionCreateSchema({
            sourceCurrencyId: data?.sourceCurrencyId,
            currencyId: defaultCurrencyId,
        }),
    );

    const hasDifferentCurrencies =
        !!form.sourceCurrencyId &&
        !!form.currencyId &&
        !isNaN(form.sourceCurrencyId) &&
        !isNaN(form.currencyId) &&
        form.sourceCurrencyId !== form.currencyId;

    const sourceCurrencySymbol = hasDifferentCurrencies ? getCurrency(form.sourceCurrencyId as number)?.currencyCode : undefined;
    const targetCurrencySymbol = hasDifferentCurrencies ? getCurrency(form.currencyId as number)?.currencyCode : undefined;

    const { data: rateData } = useAppQuery<IRate | undefined>(
        QueryKeys.rates(form.currencyId, form.sourceCurrencyId),
        () => fetchRates(sourceCurrencySymbol, targetCurrencySymbol),
        { enabled: hasDifferentCurrencies, staleTime: QueryStaleTimes.rates },
    );

    const handleCreate = async () => {
        const transactionService = TransactionService.instance();
        const response = await transactionService.doCreateTransaction({
            accountId: Number(form.accountId),
            incomeId: Number(form.incomeId),
            categoryId: Number(form.categoryId),
            currencyId: Number(form.currencyId),
            transactionTypeId: Number(form.transactionTypeId),
            amount: Number(form.amount),
            createdAt: form.createdAt,
            targetAccountId: Number(form.targetAccountId),
            description: form.description,
        });
        if (response.kind === GeneralApiProblemKind.Ok) {
            await invalidateQuery(InvalidationGroups.transaction());
            navigation.getParent()?.navigate(OverviewPath.Dashboard);
        } else if (response.kind === GeneralApiProblemKind.BadData) {
            handleBadDataResponse(response.errors, setErrors);
        } else {
            buildGeneralApiBaseHandler(response);
        }
    };

    const handleSave = async () => {
        try {
            const isValid = await save();
            if (!isValid) return;
            await handleCreate();
        } catch {
            Logger.Of('TransactionCreate').info('Validation error');
        }
    };

    return (
        <TransactionFields
            form={form}
            rates={rateData}
            isCreate={true}
            errors={errors}
            isView={false}
            isEdit={true}
            handleChange={(key: string, value: string | number) => {
                handleChange(key as keyof ITransaction, value);
            }}
            cancel={() => navigation.goBack()}
            handleSave={handleSave}
        />
    );
};
