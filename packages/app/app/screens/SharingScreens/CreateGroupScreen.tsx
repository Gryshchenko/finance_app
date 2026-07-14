import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CreateGroup } from '@/components/sharing/CreateGroup';
import { translate } from '@/i18n/translate';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath, SettingsStackParamList } from '@/navigators/SettingsStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { OverviewPath } from '@/types/OverviewPath';

type Props = NativeStackScreenProps<SettingsStackParamList, SettingsPath.CreateGroup>;

export const CreateGroupScreen = function CreateGroupScreen(_props: Props) {
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();

    return (
        <GenericListScreen
            name={translate('sharing:createGroupTitle')}
            isError={false}
            isPending={false}
            onBack={() => navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.Groups })}
            props={{ data: undefined }}
            RenderComponent={CreateGroup}
        />
    );
};
