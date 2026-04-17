import { FC } from 'react';
import { TextStyle } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { SettingsChangePublicName } from '@/components/settings/SettingsChangePublicName';
import { translate } from '@/i18n/translate';
import { SettingsPath, SettingsStackParamList } from '@/navigators/SettingsStackNavigator';
import { $styles } from '@/theme/styles';

type Props = NativeStackScreenProps<SettingsStackParamList, SettingsPath.ChangePublicName>;

export const SettingsChangePublicNameScreen: FC<Props> = function SettingsChangePublicNameScreen(_props) {
    const { route } = _props;
    const { publicName } = route.params;
    return (
        <Screen preset="fixed" contentContainerStyle={[$styles.screen, $topAlignScreen]} safeAreaEdges={['bottom']}>
            <Header
                title={translate('settingsChangePublicNameScreen:name')}
                titleMode="flex"
                titleStyle={$rightAlignTitle}
                LeftActionComponent={undefined}
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
