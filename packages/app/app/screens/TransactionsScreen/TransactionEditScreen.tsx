import { ParamListBase } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ITransaction } from 'tenpercent/shared';

import { TransactionEdit } from '@/components/transaction/TransactionEdit';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { ITransactionClient } from '@/interfaces/ITransactionClient';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { fetchTransaction } from '@/screens/TransactionsScreen/TransactionViewScreen';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';

type Props = NativeStackScreenProps<ParamListBase, string>;

export const TransactionEditScreen = function TransactionsScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string; payload: string };
    const { id } = params;
    const { isError, data, isPending } = useAppQuery<ITransaction | undefined>(
        QueryKeys.transaction(id),
        async () => fetchTransaction(id),
        { staleTime: QueryStaleTimes.detail },
    );
    const formData: Partial<ITransactionClient> | undefined = data
        ? { ...data, amount: data.amount != null ? String(data.amount) : '' }
        : undefined;
    return (
        <GenericListScreen
            name={translate('transactionScreen:name', { name: params.name })}
            isError={isError}
            isPending={isPending}
            onBack={undefined}
            props={{
                data: formData,
            }}
            RenderComponent={TransactionEdit}
        />
    );
};
