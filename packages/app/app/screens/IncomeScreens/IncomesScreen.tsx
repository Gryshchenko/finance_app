import { ParamListBase } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IIncome } from 'tenpercent/shared';
import { TransactionFieldType } from 'tenpercent/shared';
import { TransactionType } from 'tenpercent/shared';

import { AddButton } from '@/components/buttons/AddButton';
import { Incomes } from '@/components/income/Incomes';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { IncomePath } from '@/navigators/IncomesStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { IncomeService } from '@/services/IncomeService';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';
import { Logger } from '@/utils/logger/Logger';

export async function fetchIncomes(): Promise<IIncome[]> {
    try {
        const incomeService = IncomeService.instance();
        const response = await incomeService.doGetIncomes();
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as IIncome[];
            }
            default: {
                return [];
            }
        }
    } catch (e) {
        Logger.Of('FetchIncomes').error(`Fetch income failed due reason: ${(e as { message: string }).message}`);
        return [];
    }
}

type Props = NativeStackScreenProps<ParamListBase, string>;

export const IncomesScreen = function IncomesScreen(_props: Props) {
    const navigation = useNavigation();
    const { isError, data, isPending } = useAppQuery<IIncome[] | undefined>('incomes', fetchIncomes);

    return (
        <GenericListScreen
            name={translate('common:incomes')}
            isError={isError}
            isPending={isPending}
            props={{
                data,
                fetch: fetchIncomes,
                onPress: (id: number, name: string) => {
                    navigation.getParent()?.navigate(OverviewPath.Incomes, {
                        screen: TransactionPath.Transactions,
                        params: { id, name, type: TransactionFieldType.Income, path: OverviewPath.Incomes },
                    });
                },
            }}
            RightActionComponent={
                <AddButton
                    onPress={() => {
                        navigation.getParent()?.navigate(OverviewPath.Incomes, {
                            screen: TransactionPath.TransactionCreate,
                            params: {
                                path: OverviewPath.Incomes,
                                payload: {
                                    transactionTypeId: TransactionType.Income,
                                },
                            },
                        });
                    }}
                />
            }
            RenderComponent={Incomes}
        />
    );
};
