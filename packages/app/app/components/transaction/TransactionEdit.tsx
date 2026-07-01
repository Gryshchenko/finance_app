import { FC } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { ITransaction, StatsType } from 'tenpercent/shared';

import { EmptyState } from '@/components/EmptyState';
import { TransactionFields } from '@/components/transaction/TransactionFields';
import { useCurrency } from '@/context/CurrencyContext';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { useGoBackSmart } from '@/hooks/useGoBackSmart';
import { translate } from '@/i18n/translate';
import { ITransactionClient } from '@/interfaces/ITransactionClient';
import { buildTransactionEditSchema } from '@/schems/validationSchemas';
import AlertService from '@/services/AlertService';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { InvalidationGroups } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import { TransactionService } from '@/services/TransactionService';
import type { BackTarget } from '@/types/BackTarget';

interface ITransactionPros {
    data: Partial<ITransactionClient> | undefined;
    back?: BackTarget;
}

export const TransactionEdit: FC<ITransactionPros> = function TransactionEdit(_props) {
    const { data, back } = _props;
    const goBackSmart = useGoBackSmart(back);
    const invalidateQuery = useInvalidateQuery();
    const { currencies } = useCurrency();

    const { form, handleChange, save, errors, setErrors, withFetching, isFetching } = useEditView<Partial<ITransactionClient>>(
        data!,
        buildTransactionEditSchema({
            targetCurrencyCode: data?.targetCurrencyCode,
            currencyCode: data?.currencyCode!,
            currencyCodes: Array.from(currencies.keys()),
        }),
    );

    const invalidateEntityStats = async (): Promise<void> => {
        switch (back?.params?.statsType) {
            case StatsType.Expense: {
                await invalidateQuery(InvalidationGroups.entityStats(form.categoryId as number, StatsType.Expense));
                break;
            }
            case StatsType.Income: {
                await invalidateQuery(InvalidationGroups.entityStats(form.incomeId as number, StatsType.Income));
                break;
            }
            case StatsType.Account: {
                await invalidateQuery(InvalidationGroups.entityStats(form.accountId as number, StatsType.Account));
                await invalidateQuery(InvalidationGroups.entityStats(form.targetAccountId as number, StatsType.Account));
                break;
            }
        }
    };

    const handlePatch = async () => {
        await withFetching(async () => {
            const transactionService = TransactionService.instance();
            const sameCurrency = !form.targetCurrencyCode || form.targetCurrencyCode === form.currencyCode;
            const response = await transactionService.doPatchTransaction(form.transactionId!, {
                accountId: form.accountId,
                incomeId: form.incomeId,
                categoryId: form.categoryId,
                currencyCode: form.currencyCode,
                targetCurrencyCode: sameCurrency ? form.currencyCode : form.targetCurrencyCode,
                amount: Number(form.amount),
                targetAmount: sameCurrency ? Number(form.amount) : Number(form.targetAmount),
                createdAt: form.createdAt,
                targetAccountId: form.targetAccountId,
                description: form.description,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.info({
                    title: 'common:info',
                    message: 'transactionScreen:updateSuccess',
                });
                await invalidateQuery(InvalidationGroups.transaction(form.transactionId!));
                await invalidateEntityStats();
                goBackSmart();
            } else if (response.kind === GeneralApiProblemKind.BadData) {
                handleBadDataResponse(response.errors, setErrors);
            } else {
                buildGeneralApiBaseHandler(response);
            }
        });
    };

    const handleDelete = async () => {
        await withFetching(async () => {
            const transactionService = TransactionService.instance();
            if (!form.transactionId) return;

            const response = await transactionService.doDeleteTransaction(form.transactionId);
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.info({
                    title: 'common:info',
                    message: 'transactionScreen:deleteSuccess',
                });
                await invalidateQuery(InvalidationGroups.transaction());
                await invalidateEntityStats();
                goBackSmart();
            } else {
                ToastService.error({
                    title: 'common:error',
                    message: 'transactionScreen:deleteFailed',
                });
            }
        });
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
        return <EmptyState style={$containerStyleOverride} buttonOnPress={() => goBackSmart()} />;
    }

    return (
        <TransactionFields
            form={form}
            isCreate={false}
            isEdit={true}
            errors={errors}
            isView={false}
            isSaveDisabled={isFetching}
            isDeleteDisabled={isFetching}
            onDelete={onDelete}
            handleChange={(key: string, value: string | number) => {
                handleChange(key as keyof ITransaction, value);
            }}
            cancel={() => goBackSmart()}
            handleSave={handleSave}
        />
    );
};
const $containerStyleOverride: StyleProp<ViewStyle> = {
    margin: 'auto',
};
