import { ParamListBase } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ITransaction } from 'tenpercent/shared';

import { TransactionEdit } from '@/components/transaction/TransactionEdit';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { ITransactionClient } from '@/interfaces/ITransactionClient';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { TransactionService } from '@/services/TransactionService';
import { Logger } from '@/utils/logger/Logger';

type Props = NativeStackScreenProps<ParamListBase, string>;

export async function fetchTransaction(id: number | string): Promise<ITransaction | undefined> {
    try {
        const transactionsService = TransactionService.instance();
        const response = await transactionsService.doGetTransaction({
            id,
        });
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as ITransaction;
            }
            default: {
                return undefined;
            }
        }
    } catch (e) {
        Logger.Of('FetchTransaction').error(`Fetch transaction failed due reason: ${(e as { message: string }).message}`);
        return undefined;
    }
}

export const TransactionEditScreen = function TransactionsScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string; payload: string };
    const { id } = params;
    const {
        isError,
        data: fetchData,
        isPending,
    } = useAppQuery<ITransaction | undefined>(QueryKeys.transaction(id), async () => fetchTransaction(id), {
        staleTime: QueryStaleTimes.detail,
    });

    const data: Partial<ITransactionClient> | undefined = fetchData
        ? { ...fetchData, amount: fetchData.amount != null ? String(fetchData.amount) : '' }
        : undefined;
    return (
        <GenericListScreen
            name={params?.name ?? translate('common:edit')}
            isError={isError}
            isPending={isPending}
            props={{
                data,
            }}
            RenderComponent={TransactionEdit}
        />
    );
};
