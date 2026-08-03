import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IGroupSharedItem } from '@tenpercent/shared';

import { CreateGroup } from '@/components/sharing/CreateGroup';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath, SettingsStackParamList } from '@/navigators/SettingsStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { fetchShareableItems } from '@/screens/SharingScreens/sharingQueries';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { OverviewPath } from '@/types/OverviewPath';

type Props = NativeStackScreenProps<SettingsStackParamList, SettingsPath.CreateGroup>;

export const CreateGroupScreen = function CreateGroupScreen(_props: Props) {
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    const { isError, data, isPending } = useAppQuery<IGroupSharedItem[] | undefined>(
        QueryKeys.sharingShareableItems(),
        fetchShareableItems,
        { staleTime: QueryStaleTimes.list },
    );

    return (
        <GenericListScreen
            name={translate('sharing:createGroupTitle')}
            isError={isError}
            isPending={isPending}
            onBack={() => navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.Groups })}
            props={{ data }}
            RenderComponent={CreateGroup}
        />
    );
};
