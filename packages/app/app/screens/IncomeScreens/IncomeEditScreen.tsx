import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IIncome } from 'tenpercent/shared';

import { IncomeEdit } from '@/components/income/IncomeEdit';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { IncomePath } from '@/navigators/IncomesStackNavigator';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { fetchIncome } from '@/screens/IncomeScreens/IncomeViewScreen';

type Props = NativeStackScreenProps<OverviewTabParamList, IncomePath.IncomeEdit>;

export const IncomeEditScreen = function IncomeEditScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string; payload: string };
    const { isError, data, isPending } = useAppQuery<IIncome | undefined>(['income', params?.id], () => fetchIncome(params?.id));
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
