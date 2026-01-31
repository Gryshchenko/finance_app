import { FC } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ITransaction } from 'tenpercent/shared';
import { Time } from 'tenpercent/shared';

import { TransactionFields } from '@/components/transaction/TransactionFields';
import { useEditView } from '@/hooks/useEditView';
import { translate } from '@/i18n/translate';
import { buildTransactionCreateSchema } from '@/schems/validationSchemas';
import AlertService from '@/services/AlertService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { TransactionService } from '@/services/TransactionService';
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
            transactionTypeId: data?.transactionTypeId,
            createdAt: data?.createdAt || Time.getISODateNow(),
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
            AlertService.info(translate('common:info'), translate('transactionScreen:createSuccess'));
            navigation.getParent()?.goBack();
        } else {
            AlertService.error(translate('common:error'), translate('transactionScreen:createFailed'));
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
            errors={errors}
            isView={false}
            isEdit={true}
            handleChange={(key: string, value: string | number) => {
                handleChange(key as keyof ITransaction, value);
            }}
            cancel={() => {
                // navigation.getParent()?.navigate("history", {
                //   screen: "view",
                //   params: { id: form.transactionId, name: form.transactionName },
                // })
            }}
            handleSave={handleSave}
        />
    );
};
