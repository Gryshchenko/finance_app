import { FC } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ITransaction, Utils } from 'tenpercent/shared';

import { EmptyState } from '@/components/EmptyState';
import { TransactionFields } from '@/components/transaction/TransactionFields';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { translate } from '@/i18n/translate';
import { DashboardPath } from '@/navigators/DashboardStackNavigator';
import AlertService from '@/services/AlertService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import ToastService from '@/services/ToastService';
import { TransactionService } from '@/services/TransactionService';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';

interface ITransactionPros {
    data: {
        data: ITransaction | undefined;
        path: DashboardPath;
    };
}

export const TransactionView: FC<ITransactionPros> = function TransactionView(_props) {
    const {
        data: { data, path },
    } = _props;
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { form } = useEditView<ITransaction>(data!);

    const handleDelete = async () => {
        const transactionService = TransactionService.instance();
        if (!form.transactionId) return;

        const response = await transactionService.doDeleteTransaction(form.transactionId);
        if (response.kind === GeneralApiProblemKind.Ok) {
            ToastService.info({
                title: 'common:info',
                message: 'transactionScreen:deleteSuccess',
            });
            await invalidateQuery([['transactions']]);
            await invalidateQuery([['transaction', form.transactionId]]);
            navigation.getParent()?.navigate(OverviewPath.Dashboard);
        } else {
            ToastService.error({
                title: 'common:error',
                message: 'transactionScreen:deleteFailed',
            });
        }
    };

    const onDelete = () => {
        AlertService.confirm(
            translate('transactionScreen:deleteTitle'),
            translate('transactionScreen:deleteMessage'),
            handleDelete,
        );
    };

    const onEdit = () => {
        navigation.getParent()?.navigate(path, {
            screen: TransactionPath.TransactionEdit,
            params: {
                id: form.transactionId,
                payload: Utils.objectToString(form),
            },
        });
    };

    if (!data) {
        return <EmptyState style={$containerStyleOverride} buttonOnPress={() => navigation.goBack()} />;
    }

    return <TransactionFields edit={onEdit} form={form} isCreate={false} isView={true} isEdit={false} onDelete={onDelete} />;
};
const $containerStyleOverride: StyleProp<ViewStyle> = {
    margin: 'auto',
};
