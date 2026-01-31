import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IPagination } from 'tenpercent/shared';
import { ITransactionListItem } from 'tenpercent/shared';
import { TransactionFieldType } from 'tenpercent/shared';

import { AddButton } from '@/components/buttons/AddButton';
import { Transactions } from '@/components/transaction/Transactions';
import { useAppQuery } from '@/hooks/useAppQuery';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { TransactionService } from '@/services/TransactionService';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';
import { Logger } from '@/utils/logger/Logger';

export async function fetchTransactions(
    id: number | undefined,
    type: TransactionFieldType | undefined,
    cursor: number,
    limit: number,
): Promise<IPagination<ITransactionListItem> | undefined> {
    try {
        const transactionsService = TransactionService.instance();
        const response = await transactionsService.doGetTransactions({
            cursor,
            limit,
            id,
            type,
        });
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as IPagination<ITransactionListItem>;
            }
            default: {
                return undefined;
            }
        }
    } catch (e) {
        Logger.Of('FetchTransactions').error(`Fetch transactions failed due reason: ${(e as { message: string }).message}`);
        return undefined;
    }
}

type Props = NativeStackScreenProps<OverviewTabParamList, TransactionPath.Transactions>;

export const TransactionsScreen = function TransactionsScreen(_props: Props) {
    const params = _props?.route?.params as {
        id: number;
        name: string;
        type: TransactionFieldType;
        path: OverviewPath;
    };
    const navigation = useNavigation();
    const { id, type, name, path } = params;
    const { isError, data, isPending } = useAppQuery<IPagination<ITransactionListItem> | undefined>(
        ['transactions', id, type],
        async () => fetchTransactions(id, type, 0, 10),
    );

    return (
        <GenericListScreen
            name={name}
            isError={isError}
            isPending={isPending}
            props={{
                onPress: (id: number, name: string) => {
                    navigation.getParent()?.navigate(path, {
                        screen: TransactionPath.TransactionView,
                        params: { id, name, type },
                    });
                },
                data,
                fetch: async ({ cursor, limit }) => await fetchTransactions(id, type, cursor, limit),
            }}
            onBack={() => navigation.goBack()}
            RenderComponent={Transactions}
            RightActionComponent={
                <AddButton
                    onPress={() => {
                        navigation.getParent()?.navigate(path, {
                            screen: TransactionPath.TransactionCreate,
                            params: {
                                payload: {
                                    transactionTypeId: type,
                                },
                            },
                        });
                    }}
                />
            }
        />
    );
};
