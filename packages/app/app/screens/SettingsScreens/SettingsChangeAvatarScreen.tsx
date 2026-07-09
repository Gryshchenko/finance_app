import { FC } from 'react';
import { TextStyle } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { SettingsChangeAvatar } from '@/components/settings/SettingsChangeAvatar';
import { translate } from '@/i18n/translate';
import { SettingsPath, SettingsStackParamList } from '@/navigators/SettingsStackNavigator';
import { $styles } from '@/theme/styles';

type Props = NativeStackScreenProps<SettingsStackParamList, SettingsPath.ChangeAvatar>;

export const SettingsChangeAvatarScreen: FC<Props> = function SettingsChangeAvatarScreen(_props) {
    const avatar = _props.route?.params?.avatar;
    const seed = _props.route?.params?.seed ?? 'Clara Barton';
    return (
        <Screen preset="fixed" contentContainerStyle={[$styles.screen, $topAlignScreen]} safeAreaEdges={['bottom']}>
            <Header
                title={translate('settingsChangeAvatarScreen:name')}
                titleMode="flex"
                titleStyle={$rightAlignTitle}
                LeftActionComponent={undefined}
                RightActionComponent={undefined}
            />
            <SettingsChangeAvatar avatar={avatar} seed={seed} />
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
