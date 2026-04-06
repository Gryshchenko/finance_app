import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ITransaction } from 'tenpercent/shared';

import { TransactionView } from '@/components/transaction/TransactionView';
import { useAppQuery } from '@/hooks/useAppQuery';
import { DashboardPath } from '@/navigators/DashboardStackNavigator';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { TransactionService } from '@/services/TransactionService';
import { TransactionPath } from '@/types/TransactionPath';
import { Logger } from '@/utils/logger/Logger';

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

type Props = NativeStackScreenProps<OverviewTabParamList, TransactionPath.TransactionView>;

export const TransactionViewScreen = function TransactionsScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string; path: DashboardPath };
    const navigation = useNavigation();
    const { id, name, path } = params;
    const { isError, data, isPending } = useAppQuery<ITransaction | undefined>(['transaction', id], async () =>
        fetchTransaction(id),
    );

    return (
        <GenericListScreen
            name={name}
            isError={isError}
            isPending={isPending}
            props={{
                data: {
                    data,
                    path,
                },
            }}
            onBack={() => navigation.goBack()}
            RenderComponent={TransactionView}
        />
    );
};
