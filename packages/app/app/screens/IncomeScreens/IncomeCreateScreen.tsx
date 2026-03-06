import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { IncomeCreate } from '@/components/income/IncomeCreate';
import { translate } from '@/i18n/translate';
import { IncomePath } from '@/navigators/IncomesStackNavigator';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';

type Props = NativeStackScreenProps<OverviewTabParamList, IncomePath.IncomeCreate>;

export const IncomeCreateScreen = function IncomeCreateScreen(_props: Props) {
    const navigation = useNavigation();
    return (
        <GenericListScreen
            name={translate('incomeScreen:createTitle')}
            isError={false}
            isPending={false}
            onBack={() =>
                navigation.getParent()?.navigate('incomes', {
                    screen: 'accounts',
                })
            }
            props={{
                data: undefined,
            }}
            RenderComponent={IncomeCreate}
        />
    );
};
