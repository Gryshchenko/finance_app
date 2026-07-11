import { FC } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ITransaction, Time } from '@tenpercent/shared';

import { TransactionFields } from '@/components/transaction/TransactionFields';
import { useCurrency } from '@/context/CurrencyContext';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { ITransactionClient } from '@/interfaces/ITransactionClient';
import { buildTransactionCreateSchema } from '@/schems/validationSchemas';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { InvalidationGroups } from '@/services/QueryCacheService';
import { TransactionService } from '@/services/TransactionService';
import { OverviewPath } from '@/types/OverviewPath';
import { Logger } from '@/utils/logger/Logger';

interface IProps {
    data: Partial<ITransactionClient> | undefined;
    uuid?: string;
}

export const TransactionCreate: FC<IProps> = function TransactionCreate(_props: IProps) {
    const { data, uuid } = _props;
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { currencies } = useCurrency();

    const formInitial = {
        amount: '',
        createdAt: Time.getISODateNowUTC(),
        ...data,
        targetAmount: '0',
        targetCurrencyCode: data?.currencyCode === data?.targetCurrencyCode ? data?.currencyCode : data?.targetCurrencyCode,
    };

    const { form, handleChange, save, errors, setErrors, withFetching, isFetching } = useEditView<Partial<ITransactionClient>>(
        formInitial,
        buildTransactionCreateSchema({
            targetCurrencyCode: data?.targetCurrencyCode,
            currencyCode: data?.currencyCode!,
            currencyCodes: Array.from(currencies.keys()),
        }),
        uuid,
    );

    const handleCreate = async () => {
        await withFetching(async () => {
            const transactionService = TransactionService.instance();
            const sameCurrency = !form.targetCurrencyCode || form.targetCurrencyCode === form.currencyCode;
            const response = await transactionService.doCreateTransaction({
                accountId: Number(form.accountId),
                incomeId: Number(form.incomeId),
                categoryId: Number(form.categoryId),
                currencyCode: form.currencyCode,
                targetCurrencyCode: sameCurrency ? form.currencyCode : form.targetCurrencyCode,
                transactionTypeId: Number(form.transactionTypeId),
                amount: Number(form.amount),
                targetAmount: sameCurrency ? Number(form.amount) : Number(form.targetAmount),
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
        });
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
            isCreate={true}
            errors={errors}
            isView={false}
            isEdit={true}
            isSaveDisabled={isFetching}
            handleChange={(key: string, value: string | number) => {
                handleChange(key as keyof ITransaction, value);
            }}
            cancel={() => navigation.getParent()?.navigate(OverviewPath.Dashboard)}
            handleSave={handleSave}
        />
    );
};
