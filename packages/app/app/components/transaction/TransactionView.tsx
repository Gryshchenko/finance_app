import { FC } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ITransaction } from 'tenpercent/shared';

import { EmptyState } from '@/components/EmptyState';
import { TransactionFields } from '@/components/transaction/TransactionFields';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { translate } from '@/i18n/translate';
import AlertService from '@/services/AlertService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { TransactionService } from '@/services/TransactionService';

interface ITransactionPros {
    data: ITransaction | undefined;
}

export const TransactionView: FC<ITransactionPros> = function TransactionView(_props) {
    const { data } = _props;
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { form } = useEditView<ITransaction>(data!);

    const handleDelete = async () => {
        const transactionService = TransactionService.instance();
        if (!form.transactionId) return;

        const response = await transactionService.doDeleteTransaction(form.transactionId);
        if (response.kind === GeneralApiProblemKind.Ok) {
            await invalidateQuery([['transactions']]);
            await invalidateQuery([['transaction', form.transactionId]]);
            AlertService.info(translate('common:info'), translate('transactionScreen:deleteSuccess'));
            navigation.goBack();
        } else {
            AlertService.error(translate('common:error'), translate('transactionScreen:deleteFailed'));
        }
    };

    const onDelete = () => {
        AlertService.confirm(
            translate('transactionScreen:deleteTitle'),
            translate('transactionScreen:deleteMessage'),
            handleDelete,
        );
    };

    if (!data) {
        return <EmptyState style={$containerStyleOverride} buttonOnPress={() => navigation.goBack()} />;
    }

    return <TransactionFields form={form} isView={true} isEdit={false} onDelete={onDelete} />;
};
const $containerStyleOverride: StyleProp<ViewStyle> = {
    margin: 'auto',
};
