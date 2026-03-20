import { FC } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ITransaction } from 'tenpercent/shared';
import { Time } from 'tenpercent/shared';

import { TransactionFields } from '@/components/transaction/TransactionFields';
import { useEditView } from '@/hooks/useEditView';
import { buildTransactionCreateSchema } from '@/schems/validationSchemas';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import ToastService from '@/services/ToastService';
import { TransactionService } from '@/services/TransactionService';
import { OverviewPath } from '@/types/OverviewPath';
import { Logger } from '@/utils/logger/Logger';

interface IProps {
    data: Partial<ITransaction> | undefined;
}

export const TransactionCreate: FC<IProps> = function TransactionCreate(_props: IProps) {
    const { data } = _props;
    const navigation = useNavigation();
    const { form, handleChange, save, errors } = useEditView<Partial<ITransaction>>(
        {
            amount: 0,
            currencyId: 1,
            createdAt: Time.getISODateNow(),
            ...data,
        },
        buildTransactionCreateSchema(),
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
