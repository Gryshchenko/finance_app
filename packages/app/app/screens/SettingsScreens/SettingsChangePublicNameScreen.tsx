import { FC } from 'react';
import { TextStyle } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BackButton } from '@/components/BackButton';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { SettingsChangePublicName } from '@/components/settings/SettingsChangePublicName';
import { translate } from '@/i18n/translate';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath, SettingsStackParamList } from '@/navigators/SettingsStackNavigator';
import { $styles } from '@/theme/styles';
import { OverviewPath } from '@/types/OverviewPath';

type Props = NativeStackScreenProps<SettingsStackParamList, SettingsPath.ChangePublicName>;

export const SettingsChangePublicNameScreen: FC<Props> = function SettingsChangePublicNameScreen(_props) {
    const publicName = _props.route?.params?.publicName;
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    return (
        <Screen preset="fixed" contentContainerStyle={[$styles.screen, $topAlignScreen]} safeAreaEdges={['bottom']}>
            <Header
                title={translate('settingsChangePublicNameScreen:name')}
                titleMode="flex"
                titleStyle={$rightAlignTitle}
                LeftActionComponent={
                    <BackButton
                        onPress={() => {
                            navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.Settings });
                        }}
                    />
                }
                RightActionComponent={undefined}
            />
            <SettingsChangePublicName publicName={publicName} />
        </Screen>
    );
};

const $topAlignScreen: TextStyle = {
    justifyContent: 'flex-start',
};

const $rightAlignTitle: TextStyle = {
    textAlign: 'center',
    textTransform: 'uppercase',
};
