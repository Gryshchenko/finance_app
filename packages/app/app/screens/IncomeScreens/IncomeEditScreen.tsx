import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IIncome, Utils } from 'tenpercent/shared';

import { IncomeEdit } from '@/components/income/IncomeEdit';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { IncomePath, IncomesStackParamList } from '@/navigators/IncomesStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { IncomeService } from '@/services/IncomeService';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
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

type Props = NativeStackScreenProps<IncomesStackParamList, IncomePath.IncomeEdit>;

export const IncomeEditScreen = function IncomeEditScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string; payload: string };
    const { isError, data, isPending } = useAppQuery<IIncome | undefined>(
        QueryKeys.income(params?.id),
        () => fetchIncome(params?.id),
        { staleTime: QueryStaleTimes.detail },
    );
    return (
        <GenericListScreen
            name={data?.incomeName ?? translate('incomeScreen:editTitle')}
            isError={isError}
            isPending={isPending}
            onBack={undefined}
            props={{
                data,
            }}
            RenderComponent={IncomeEdit}
        />
    );
};
