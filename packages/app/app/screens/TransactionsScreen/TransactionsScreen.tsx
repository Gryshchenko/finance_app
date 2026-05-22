import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IPagination, ITransactionListItem, StatsType, TransactionFieldType } from 'tenpercent/shared';

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
    cursor: string | null | undefined,
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

type Props = NativeStackScreenProps<ParamListBase, string>;

type TransactionsRouteParams = {
    id: number;
    name: string;
    type: TransactionFieldType;
    path: OverviewPath;
    statsType: StatsType;
    currencyId: number;
};

export const TransactionsScreen = function TransactionsScreen(_props: Props) {
    const params = _props?.route?.params as TransactionsRouteParams | undefined;
    const navigation = useNavigation();
    const { isError, data, isPending } = useAppQuery<IPagination<ITransactionListItem> | undefined>(
        QueryKeys.transactions(params?.id, params?.type),
        async () => fetchTransactions(params?.id, params?.type, undefined, 10),
        { staleTime: QueryStaleTimes.transactions, enabled: !!params },
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

    // TransactionStackNavigator is wrapped in ResetOnBlur, which remounts the
    // whole stack on tab blur. A fresh stack renders its initial route
    // (TransactionsScreen) with no params — render nothing in that transient case.
    if (!params) {
        return null;
    }

    const { id, type, name, path, statsType, currencyId } = params;

    return (
        <GenericListScreen
            name={translate('transactionScreen:title', { name })}
            isError={isError}
            isPending={isPending}
            props={{
                onPress: (idEdit: number, nameEdit: string) => {
                    navigation.getParent()?.navigate(OverviewPath.Transactions, {
                        screen: TransactionPath.TransactionEdit,
                        params: {
                            id: idEdit,
                            name: nameEdit,
                            type,
                            path,
                            back: {
                                path: OverviewPath.Transactions,
                                screen: TransactionPath.Transactions,
                                params: { id, name, type, path, statsType, currencyId },
                            },
                        },
                    });
                },
                data: {
                    transactions: data,
                    entityId: id,
                    statsType,
                    currencyId,
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
                                back: {
                                    path: OverviewPath.Transactions,
                                    screen: TransactionPath.Transactions,
                                    params: { id, name, type, path, statsType, currencyId },
                                },
                            },
                        });
                    }}
                />
            }
        />
    );
};
