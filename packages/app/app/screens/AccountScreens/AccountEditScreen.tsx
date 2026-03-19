import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IAccount } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';

import { AccountEdit } from '@/components/account/AccountEdit';
import { translate } from '@/i18n/translate';
import { AccountsPath } from '@/navigators/AccountsStackNavigator';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';

type Props = NativeStackScreenProps<OverviewTabParamList, AccountsPath.AccountEdit>;

export const AccountEditScreen = function AccountEditScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string; payload: string };
    const data = Utils.parseObject<IAccount | undefined>(params.payload);
    return (
        <GenericListScreen
            name={data?.accountName ?? translate('accountScreen:editTitle')}
            isError={false}
            isPending={false}
            onBack={undefined}
            props={{
                data,
            }}
            RenderComponent={AccountEdit}
        />
    );
};
