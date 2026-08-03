import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IConnectedMember } from '@tenpercent/shared';

import { MemberSettings } from '@/components/sharing/MemberSettings';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath, SettingsStackParamList } from '@/navigators/SettingsStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { fetchConnection } from '@/screens/SharingScreens/sharingQueries';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { OverviewPath } from '@/types/OverviewPath';

type Props = NativeStackScreenProps<SettingsStackParamList, SettingsPath.MemberSettings>;

export const MemberSettingsScreen = function MemberSettingsScreen(_props: Props) {
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    const connectionId = _props?.route?.params?.connectionId;
    const { isError, data, isPending } = useAppQuery<IConnectedMember | undefined>(
        QueryKeys.sharingConnection(Number(connectionId)),
        () => fetchConnection(Number(connectionId)),
        { staleTime: QueryStaleTimes.detail },
    );
    const member = data;
    return (
        <GenericListScreen
            name={translate('sharing:memberTitle')}
            subtitle={member ? translate('sharing:memberCaption') : undefined}
            isError={isError}
            isPending={isPending}
            onBack={() => navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.ConnectedUsers })}
            props={{ data: member }}
            RenderComponent={MemberSettings}
        />
    );
};
