import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AccountCreate } from '@/components/account/AccountCreate';
import { translate } from '@/i18n/translate';
import { AccountsPath, AccountsStackParamList } from '@/navigators/AccountsStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';

type Props = NativeStackScreenProps<AccountsStackParamList, AccountsPath.AccountsCreate>;

export const AccountCreateScreen = function AccountCreateScreen(_props: Props) {
    return (
        <GenericListScreen
            name={translate('accountScreen:createTitle')}
            isError={false}
            isPending={false}
            props={{
                data: undefined,
            }}
            RenderComponent={AccountCreate}
        />
    );
};
