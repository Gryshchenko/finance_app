import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IIncome } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';

import { IncomeView } from '@/components/income/IncomeView';
import { useAppQuery } from '@/hooks/useAppQuery';
import { IncomePath } from '@/navigators/IncomesStackNavigator';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { IncomeService } from '@/services/IncomeService';
import { OverviewPath } from '@/types/OverviewPath';
import { ValidationError } from '@/utils/errors/ValidationError';
import { Logger } from '@/utils/logger/Logger';

export async function fetchIncome(id: number): Promise<IIncome | undefined> {
    try {
        if (Utils.isNull(id)) {
            throw new ValidationError({
                message: 'ID = null',
            });
        }
        const incomeService = IncomeService.instance();
        const response = await incomeService.doGetIncome(id);
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as IIncome;
            }
            default: {
                return undefined;
            }
        }
    } catch (e) {
        Logger.Of('FetchIncomes').error(`Fetch incomeId ${id}  failed due reason: ${(e as { message: string }).message}`);
        return undefined;
    }
}

type Props = NativeStackScreenProps<OverviewTabParamList, IncomePath.IncomeView>;

export const IncomeViewScreen = function IncomeViewScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string };
    const navigation = useNavigation();
    const { isError, data, isPending } = useAppQuery<IIncome | undefined>(['income', params?.id], () => fetchIncome(params?.id));

    return (
        <GenericListScreen
            name={data?.incomeName ?? ''}
            isError={isError}
            isPending={isPending}
            onBack={() => navigation.getParent()?.navigate(OverviewPath.Dashboard)}
            props={{
                data,
            }}
            RenderComponent={IncomeView}
        />
    );
};
