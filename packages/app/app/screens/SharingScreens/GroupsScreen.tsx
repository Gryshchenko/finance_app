import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IShareGroup } from '@tenpercent/shared';

import { PressableIcon } from '@/components/Icon';
import { GroupsList } from '@/components/sharing/GroupsList';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath, SettingsStackParamList } from '@/navigators/SettingsStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { fetchSharingGroups } from '@/screens/SharingScreens/sharingQueries';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { OverviewPath } from '@/types/OverviewPath';

type Props = NativeStackScreenProps<SettingsStackParamList, SettingsPath.Groups>;

export const GroupsScreen = function GroupsScreen(_props: Props) {
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    const { isError, data, isPending } = useAppQuery<IShareGroup[] | undefined>(QueryKeys.sharingGroups(), fetchSharingGroups, {
        staleTime: QueryStaleTimes.list,
    });

    const goToSettings = () => navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.Settings });
    const goToCreate = () => navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.CreateGroup });
    const goToEdit = (userGroupId: number) =>
        navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.EditGroup, params: { userGroupId } });

    return (
        <GenericListScreen
            name={translate('sharing:groupsTitle')}
            isError={isError}
            isPending={isPending}
            onBack={goToSettings}
            RightActionComponent={<PressableIcon size={22} icon="add" onPress={goToCreate} />}
            props={{
                data,
                onPressGroup: goToEdit,
            }}
            RenderComponent={GroupsList}
        />
    );
};
