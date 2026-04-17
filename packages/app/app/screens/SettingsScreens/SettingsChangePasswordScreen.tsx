import { FC } from 'react';
import { TextStyle } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { SettingsChangePassword } from '@/components/settings/SettingsChangePassword';
import { translate } from '@/i18n/translate';
import { SettingsPath, SettingsStackParamList } from '@/navigators/SettingsStackNavigator';
import { $styles } from '@/theme/styles';

type Props = NativeStackScreenProps<SettingsStackParamList, SettingsPath.ChangePassword>;

export const SettingsChangePasswordScreen: FC<Props> = function SettingsChangePasswordScreen() {
    return (
        <Screen preset="fixed" contentContainerStyle={[$styles.screen, $topAlignScreen]} safeAreaEdges={['bottom']}>
            <Header
                title={translate('settingsChangePasswordScreen:name')}
                titleMode="flex"
                titleStyle={$rightAlignTitle}
                LeftActionComponent={undefined}
                RightActionComponent={undefined}
            />
            <SettingsChangePassword />
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
