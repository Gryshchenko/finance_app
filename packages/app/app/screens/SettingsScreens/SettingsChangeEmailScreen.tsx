import { FC } from 'react';
import { TextStyle } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { SettingsChangeEmail } from '@/components/settings/SettingsChangeEmail';
import { translate } from '@/i18n/translate';
import { SettingsPath, SettingsStackParamList } from '@/navigators/SettingsStackNavigator';
import { $styles } from '@/theme/styles';

type Props = NativeStackScreenProps<SettingsStackParamList, SettingsPath.ChangeEmail>;

export const SettingsChangeEmailScreen: FC<Props> = function SettingsChangeEmailScreen(_props) {
    const { route } = _props;
    const { email, originEmail } = route.params;
    return (
        <Screen preset="fixed" contentContainerStyle={[$styles.screen, $topAlignScreen]} safeAreaEdges={['bottom']}>
            <Header
                title={translate('settingsChangeEmailScreen:name')}
                titleMode="flex"
                titleStyle={$rightAlignTitle}
                LeftActionComponent={undefined}
                RightActionComponent={undefined}
            />
            <SettingsChangeEmail email={email} originEmail={originEmail} />
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
