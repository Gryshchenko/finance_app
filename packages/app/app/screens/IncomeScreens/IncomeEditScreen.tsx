import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IIncome } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';

import { IncomeEdit } from '@/components/income/IncomeEdit';
import { translate } from '@/i18n/translate';
import { IncomePath } from '@/navigators/IncomesStackNavigator';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';

type Props = NativeStackScreenProps<OverviewTabParamList, IncomePath.IncomeEdit>;

export const IncomeEditScreen = function IncomeEditScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string; payload: string };
    const data = Utils.parseObject<IIncome | undefined>(params.payload);
    return (
        <GenericListScreen
            name={data?.incomeName ?? translate('incomeScreen:editTitle')}
            isError={false}
            isPending={false}
            onBack={undefined}
            props={{
                data,
            }}
            RenderComponent={IncomeEdit}
        />
    );
};
