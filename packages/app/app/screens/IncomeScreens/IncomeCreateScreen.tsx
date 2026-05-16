import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { IncomeCreate } from '@/components/income/IncomeCreate';
import { translate } from '@/i18n/translate';
import { IncomePath, IncomesStackParamList } from '@/navigators/IncomesStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';

type Props = NativeStackScreenProps<IncomesStackParamList, IncomePath.IncomeCreate>;

export const IncomeCreateScreen = function IncomeCreateScreen(_props: Props) {
    return (
        <GenericListScreen
            name={translate('incomeScreen:createTitle')}
            isError={false}
            isPending={false}
            props={{
                data: undefined,
            }}
            RenderComponent={IncomeCreate}
        />
    );
};
