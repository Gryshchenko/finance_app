import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AccountCreate } from '@/components/account/AccountCreate';
import { translate } from '@/i18n/translate';
import { AccountsPath } from '@/navigators/AccountsStackNavigator';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { OverviewPath } from '@/types/OverviewPath';

type Props = NativeStackScreenProps<OverviewTabParamList, AccountsPath.AccountsCreate>;

export const AccountCreateScreen = function AccountCreateScreen(_props: Props) {
    const navigation = useNavigation();
    return (
        <GenericListScreen
            name={translate('accountScreen:createTitle')}
            isError={false}
            isPending={false}
            onBack={() => navigation.getParent()?.navigate(OverviewPath.Dashboard)}
            props={{
                data: undefined,
            }}
            RenderComponent={AccountCreate}
        />
    );
};
