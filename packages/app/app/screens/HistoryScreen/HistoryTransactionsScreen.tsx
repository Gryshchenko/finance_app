import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IPagination, ITransactionListItem, TransactionType } from 'tenpercent/shared';

import { AddButton } from '@/components/buttons/AddButton';
import { Transactions } from '@/components/transaction/Transactions';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { fetchTransactions } from '@/screens/TransactionsScreen/TransactionsScreen';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';

type Props = NativeStackScreenProps<ParamListBase, string>;

export const HistoryTransactionsScreen = function HistoryScreen(_props: Props) {
    const navigation = useNavigation();
    const { isError, data, isPending } = useAppQuery<IPagination<ITransactionListItem> | null>(['transactions'], async () =>
        fetchTransactions(undefined, undefined, undefined, 10),
    );

    return (
        <GenericListScreen
            name={translate('common:history')}
            isError={isError}
            isPending={isPending}
            props={{
                data,
                fetch: async ({ cursor, limit }) => await fetchTransactions(undefined, undefined, cursor, limit),
                onPress: (id: number, name: string) => {
                    navigation.getParent()?.navigate(OverviewPath.Transactions, {
                        screen: TransactionPath.TransactionView,
                        params: { id, name },
                    });
                },
            }}
            RightActionComponent={
                <AddButton
                    onPress={() => {
                        navigation.getParent()?.navigate(OverviewPath.Transactions, {
                            screen: TransactionPath.TransactionCreate,
                            params: {
                                payload: {
                                    transactionTypeId: TransactionType.Expense,
                                },
                            },
                        });
                    }}
                />
            }
            RenderComponent={Transactions}
        />
    );
};
