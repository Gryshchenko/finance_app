import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IShareGroup } from '@tenpercent/shared';

import { EditGroup } from '@/components/sharing/EditGroup';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath, SettingsStackParamList } from '@/navigators/SettingsStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { fetchSharingGroup } from '@/screens/SharingScreens/sharingQueries';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { OverviewPath } from '@/types/OverviewPath';

type Props = NativeStackScreenProps<SettingsStackParamList, SettingsPath.EditGroup>;

export const EditGroupScreen = function EditGroupScreen(_props: Props) {
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    const userGroupId = Number(_props?.route?.params?.userGroupId);
    const { isError, data, isPending } = useAppQuery<IShareGroup | undefined>(
        QueryKeys.sharingGroup(userGroupId),
        () => fetchSharingGroup(userGroupId),
        { staleTime: QueryStaleTimes.detail },
    );

    return (
        <GenericListScreen
            name={data?.groupName ?? translate('sharing:editGroupTitle')}
            subtitle={data ? translate('sharing:groupCaption') : undefined}
            isError={isError}
            isPending={isPending}
            onBack={() => navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.Groups })}
            props={{ data }}
            RenderComponent={EditGroup}
        />
    );
};
