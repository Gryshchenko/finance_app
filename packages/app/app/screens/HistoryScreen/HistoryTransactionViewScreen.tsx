import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ITransaction } from 'tenpercent/shared';

import { TransactionView } from '@/components/transaction/TransactionView';
import { useAppQuery } from '@/hooks/useAppQuery';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { fetchTransaction } from '@/screens/TransactionsScreen/TransactionViewScreen';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';

type Props = NativeStackScreenProps<OverviewTabParamList, TransactionPath.TransactionView>;

export const HistoryTransactionViewScreen = function TransactionViewScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string };
    const navigation = useNavigation();
    const { id, name } = params;
    const { isError, data, isPending } = useAppQuery<ITransaction | undefined>(['transaction', id], async () =>
        fetchTransaction(id),
    );

    return (
        <GenericListScreen
            name={name}
            isError={isError}
            isPending={isPending}
            props={{
                data,
            }}
            onBack={() => navigation.getParent()?.navigate(OverviewPath.Dashboard)}
            RenderComponent={TransactionView}
        />
    );
};
