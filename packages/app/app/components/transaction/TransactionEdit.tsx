import { FC } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ITransaction } from 'tenpercent/shared';

import { EmptyState } from '@/components/EmptyState';
import { TransactionFields } from '@/components/transaction/TransactionFields';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { translate } from '@/i18n/translate';
import { ITransactionClient } from '@/interfaces/ITransactionClient';
import { buildTransactionEditSchema } from '@/schems/validationSchemas';
import AlertService from '@/services/AlertService';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { InvalidationGroups } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import { TransactionService } from '@/services/TransactionService';
import { OverviewPath } from '@/types/OverviewPath';

interface ITransactionPros {
    data: Partial<ITransactionClient> | undefined;
}

export const TransactionEdit: FC<ITransactionPros> = function TransactionEdit(_props) {
    const { data } = _props;
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, save, errors, setErrors } = useEditView<Partial<ITransactionClient>>(
        data!,
        buildTransactionEditSchema(),
    );

    const handlePatch = async () => {
        const transactionService = TransactionService.instance();

        const response = await transactionService.doPatchTransaction(form.transactionId!, {
            accountId: form.accountId,
            incomeId: form.incomeId,
            categoryId: form.categoryId,
            currencyId: form.currencyId,
            amount: Number(form.amount),
            createdAt: form.createdAt,
            targetAccountId: form.targetAccountId,
            description: form.description,
        });
        if (response.kind === GeneralApiProblemKind.Ok) {
            ToastService.info({
                title: 'common:info',
                message: 'transactionScreen:updateSuccess',
            });
            await invalidateQuery(InvalidationGroups.transaction(form.transactionId));
            navigation.getParent()?.navigate(OverviewPath.Dashboard);
        } else if (response.kind === GeneralApiProblemKind.BadData) {
            handleBadDataResponse(response.errors, setErrors);
        } else {
            buildGeneralApiBaseHandler(response);
        }
    };

    const handleDelete = async () => {
        const transactionService = TransactionService.instance();
        if (!form.transactionId) return;

        const response = await transactionService.doDeleteTransaction(form.transactionId);
        if (response.kind === GeneralApiProblemKind.Ok) {
            ToastService.info({
                title: 'common:info',
                message: 'transactionScreen:deleteSuccess',
            });
            await invalidateQuery(InvalidationGroups.transaction(form.transactionId));
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
    const handleSave = async () => {
        const isValid = await save();
        if (!isValid) return;
        await handlePatch();
    };
    if (!data) {
        return <EmptyState style={$containerStyleOverride} buttonOnPress={() => navigation.goBack()} />;
    }

    return (
        <TransactionFields
            form={form}
            isCreate={false}
            isEdit={true}
            errors={errors}
            isView={false}
            onDelete={onDelete}
            handleChange={(key: string, value: string | number) => {
                handleChange(key as keyof ITransaction, value);
            }}
            cancel={() => navigation.goBack()}
            handleSave={handleSave}
        />
    );
};
const $containerStyleOverride: StyleProp<ViewStyle> = {
    margin: 'auto',
};
