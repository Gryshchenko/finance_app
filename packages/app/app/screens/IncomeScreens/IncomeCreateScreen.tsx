import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { IncomeCreate } from '@/components/income/IncomeCreate';
import { translate } from '@/i18n/translate';
import { IncomePath, IncomesStackParamList } from '@/navigators/IncomesStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { OverviewPath } from '@/types/OverviewPath';

type Props = NativeStackScreenProps<IncomesStackParamList, IncomePath.IncomeCreate>;

export const IncomeCreateScreen = function IncomeCreateScreen(_props: Props) {
    const navigation = useNavigation();
    return (
        <GenericListScreen
            name={translate('incomeScreen:createTitle')}
            isError={false}
            isPending={false}
            onBack={() => navigation.getParent()?.navigate(OverviewPath.Dashboard)}
            props={{
                data: undefined,
            }}
            RenderComponent={IncomeCreate}
        />
    );
};
