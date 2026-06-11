import { FC } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ITransaction, Time } from 'tenpercent/shared';

import { TransactionFields } from '@/components/transaction/TransactionFields';
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

    const formInitial = {
        amount: '',
        createdAt: Time.getISODateNowUTC(),
        ...data,
        targetAmount: '0',
        targetCurrencyId: data?.currencyId === data?.targetCurrencyId ? data?.currencyId : data?.targetCurrencyId,
    };

    const { form, handleChange, save, errors, setErrors } = useEditView<Partial<ITransactionClient>>(
        formInitial,
        buildTransactionCreateSchema({
            targetCurrencyId: data?.targetCurrencyId,
            currencyId: data?.currencyId!,
        }),
        uuid,
    );

    const handleCreate = async () => {
        const transactionService = TransactionService.instance();
        const sameCurrency = !form.targetCurrencyId || form.targetCurrencyId === form.currencyId;
        const response = await transactionService.doCreateTransaction({
            accountId: Number(form.accountId),
            incomeId: Number(form.incomeId),
            categoryId: Number(form.categoryId),
            currencyId: Number(form.currencyId),
            targetCurrencyId: sameCurrency ? Number(form.currencyId) : Number(form.targetCurrencyId),
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
            handleChange={(key: string, value: string | number) => {
                handleChange(key as keyof ITransaction, value);
            }}
            cancel={() => navigation.getParent()?.navigate(OverviewPath.Dashboard)}
            handleSave={handleSave}
        />
    );
};
