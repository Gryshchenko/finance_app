import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IPagination, ITransactionListItem, TransactionFieldType, TransactionType } from 'tenpercent/shared';

import { EditButton } from '@/components/buttons/EditButton';
import { Transactions } from '@/components/transaction/Transactions';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { AccountsPath } from '@/navigators/AccountsStackNavigator';
import { CategoriesPath } from '@/navigators/CategoriesStackNavigator';
import { IncomePath } from '@/navigators/IncomesStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import { TransactionService } from '@/services/TransactionService';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';
import { Logger } from '@/utils/logger/Logger';

export async function fetchTransactions(
    id: number | undefined,
    type: TransactionFieldType | undefined,
    cursor: number,
    limit: number,
): Promise<IPagination<ITransactionListItem> | null> {
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
                return null;
            }
        }
    } catch (e) {
        Logger.Of('FetchTransactions').error(`Fetch transactions failed due reason: ${(e as { message: string }).message}`);
        return null;
    }
}

type Props = NativeStackScreenProps<ParamListBase, string>;

export const TransactionsScreen = function TransactionsScreen(_props: Props) {
    const params = _props?.route?.params as {
        id: number;
        name: string;
        type: TransactionFieldType;
        path: OverviewPath;
        transactionType: TransactionType;
    };
    const navigation = useNavigation();
    const { id, type, name, path, transactionType } = params;
    const { isError, data, isPending } = useAppQuery<IPagination<ITransactionListItem> | null>(
        QueryKeys.transactions(id, type),
        async () => fetchTransactions(id, type, 0, 10),
        { staleTime: QueryStaleTimes.transactions },
    );
    const getScreenForEditPath = (path: OverviewPath) => {
        switch (path) {
            case OverviewPath.Accounts:
                return AccountsPath.AccountEdit;
            case OverviewPath.Categories:
                return CategoriesPath.CategoryEdit;
            case OverviewPath.Incomes:
                return IncomePath.IncomeEdit;
            default:
                ToastService.error({ message: 'errorCode:UNKNOWN_ERROR', systemMessage: 'Unknown path for edit transaction' });
                return undefined;
        }
    };
    return (
        <GenericListScreen
            name={translate('transactionScreen:title', { name })}
            isError={isError}
            isPending={isPending}
            props={{
                onPress: (id: number, name: string) => {
                    navigation.getParent()?.navigate(path, {
                        screen: TransactionPath.TransactionEdit,
                        params: { id, name, type, path },
                    });
                },
                data: {
                    transactions: data,
                    entityId: id,
                    transactionType,
                },
                fetch: async ({ cursor, limit }) => await fetchTransactions(id, type, cursor, limit),
            }}
            onBack={() => {
                navigation.getParent()?.navigate(OverviewPath.Dashboard);
            }}
            RenderComponent={Transactions}
            RightActionComponent={
                <EditButton
                    onPress={() => {
                        const screen = getScreenForEditPath(path);
                        if (!screen) return;
                        navigation.getParent()?.navigate(path, {
                            screen: screen,
                            params: {
                                id,
                                name,
                                type,
                                path,
                            },
                        });
                    }}
                />
            }
        />
    );
};
