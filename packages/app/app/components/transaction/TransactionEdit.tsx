import { FC } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ITransaction } from 'tenpercent/shared';

import { EmptyState } from '@/components/EmptyState';
import { TransactionFields } from '@/components/transaction/TransactionFields';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { translate } from '@/i18n/translate';
import { buildTransactionEditSchema } from '@/schems/validationSchemas';
import AlertService from '@/services/AlertService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { TransactionService } from '@/services/TransactionService';

interface ITransactionPros {
    data: Partial<ITransaction> | undefined;
}

export const TransactionEdit: FC<ITransactionPros> = function TransactionEdit(_props) {
    const { data } = _props;
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, save, errors } = useEditView<Partial<ITransaction>>(data!, buildTransactionEditSchema());

    const handlePatch = async () => {
        const transactionService = TransactionService.instance();

        const response = await transactionService.doPatchTransaction(form.transactionId!, {
            accountId: form.accountId,
            incomeId: form.incomeId,
            categoryId: form.categoryId,
            currencyId: form.currencyId,
            amount: form.amount,
            createdAt: form.createdAt,
            targetAccountId: form.targetAccountId,
            description: form.description,
        });
        if (response.kind === GeneralApiProblemKind.Ok) {
            AlertService.info(translate('common:info'), translate('transactionScreen:updateSuccess'));
            await invalidateQuery([['transactions']]);
            await invalidateQuery([['transaction', form.transactionId]]);
            navigation.getParent()?.navigate('transactions', {
                screen: 'accounts',
            });
        } else {
            AlertService.error(translate('common:error'), translate('transactionScreen:updateFailed'));
        }
    };

    const handleSave = async () => {
        await save();
        await handlePatch();
    };
    if (!data) {
        return <EmptyState style={$containerStyleOverride} buttonOnPress={() => navigation.goBack()} />;
    }

    return (
        <TransactionFields
            form={form}
            isEdit={true}
            errors={errors}
            isView={false}
            handleChange={(key: string, value: string | number) => {
                handleChange(key as keyof ITransaction, value);
            }}
            cancel={() => {}}
            handleSave={handleSave}
        />
    );
};
const $containerStyleOverride: StyleProp<ViewStyle> = {
    margin: 'auto',
};
