import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { InviteUser } from '@/components/sharing/InviteUser';
import { translate } from '@/i18n/translate';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath, SettingsStackParamList } from '@/navigators/SettingsStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { OverviewPath } from '@/types/OverviewPath';

type Props = NativeStackScreenProps<SettingsStackParamList, SettingsPath.InviteUser>;

export const InviteUserScreen = function InviteUserScreen(_props: Props) {
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();

    return (
        <GenericListScreen
            name={translate('sharing:inviteTitle')}
            isError={false}
            isPending={false}
            onBack={() => navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.ConnectedUsers })}
            props={{ data: undefined }}
            RenderComponent={InviteUser}
        />
    );
};
