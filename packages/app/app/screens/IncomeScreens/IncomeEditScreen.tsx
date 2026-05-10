import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IIncome } from 'tenpercent/shared';

import { IncomeEdit } from '@/components/income/IncomeEdit';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { IncomePath, IncomesStackParamList } from '@/navigators/IncomesStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { fetchIncome } from '@/screens/IncomeScreens/IncomeViewScreen';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';

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
