import { FC } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ITransaction } from 'tenpercent/shared';
import { Time } from 'tenpercent/shared';
import { IRate } from 'tenpercent/shared/dist/interfaces/IRate';

import { TransactionFields } from '@/components/transaction/TransactionFields';
import { useCurrency } from '@/context/CurrencyContext';
import { useAppQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { ITransactionClient } from '@/interfaces/ITransactionClient';
import { buildTransactionCreateSchema } from '@/schems/validationSchemas';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { ExchangeService } from '@/services/ExchangeService';
import ToastService from '@/services/ToastService';
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
        return undefined;
    }
};

export const TransactionCreate: FC<IProps> = function TransactionCreate(_props: IProps) {
    const { data } = _props;
    const { getCurrency, defaultCurrencyId } = useCurrency();
    const navigation = useNavigation();

    const { form, handleChange, save, errors } = useEditView<Partial<ITransactionClient>>(
        {
            amount: 0,
            amountInCurrency: 0,
            currencyId: defaultCurrencyId,
            createdAt: Time.getISODateNow(),
            ...data,
        },
        buildTransactionCreateSchema(),
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
        ['rates', form.currencyId, form.sourceCurrencyId],
        () => fetchRates(sourceCurrencySymbol, targetCurrencySymbol),
        { enabled: hasDifferentCurrencies },
    );

    const handleCreate = async () => {
        const transactionService = TransactionService.instance();
        const response = await transactionService.doCreateTransaction({
            accountId: form.accountId,
            incomeId: form.incomeId,
            categoryId: form.categoryId,
            currencyId: form.currencyId,
            transactionTypeId: form.transactionTypeId,
            amount: form.amount,
            createdAt: form.createdAt,
            targetAccountId: form.targetAccountId,
            description: form.description,
        });
        if (response.kind === GeneralApiProblemKind.Ok) {
            navigation.getParent()?.navigate(OverviewPath.Dashboard);
        } else {
            ToastService.error({
                message: 'errorCode:UNKNOWN_ERROR',
                systemMessage: `response kind: ${response.kind}, on create transaction`,
            });
        }
    };

    const handleSave = async () => {
        try {
            await save();
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
