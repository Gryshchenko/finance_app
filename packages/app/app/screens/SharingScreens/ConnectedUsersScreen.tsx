import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IConnectedMember } from '@tenpercent/shared';

import { PressableIcon } from '@/components/Icon';
import { ConnectedUsersList } from '@/components/sharing/ConnectedUsersList';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath, SettingsStackParamList } from '@/navigators/SettingsStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { fetchConnections } from '@/screens/SharingScreens/sharingQueries';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { OverviewPath } from '@/types/OverviewPath';

type Props = NativeStackScreenProps<SettingsStackParamList, SettingsPath.ConnectedUsers>;

export const ConnectedUsersScreen = function ConnectedUsersScreen(_props: Props) {
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    const { isError, data, isPending } = useAppQuery<IConnectedMember[] | undefined>(
        QueryKeys.sharingConnections(),
        fetchConnections,
        { staleTime: QueryStaleTimes.list },
    );

    const goToSettings = () => navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.Settings });
    const goToInvite = () => navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.InviteUser });
    const goToMember = (connectionId: number) =>
        navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.MemberSettings, params: { connectionId } });

    return (
        <GenericListScreen
            name={translate('sharing:connectedUsersTitle')}
            isError={isError}
            isPending={isPending}
            onBack={goToSettings}
            RightActionComponent={<PressableIcon size={22} icon="add" onPress={goToInvite} />}
            props={{
                data,
                onPressUser: goToMember,
            }}
            RenderComponent={ConnectedUsersList}
        />
    );
};
