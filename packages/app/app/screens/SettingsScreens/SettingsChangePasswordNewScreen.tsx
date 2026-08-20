import { FC } from 'react';
import { TextStyle } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BackButton } from '@/components/BackButton';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { SettingsChangePasswordNew } from '@/components/settings/SettingsChangePasswordNew';
import { translate } from '@/i18n/translate';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath, SettingsStackParamList } from '@/navigators/SettingsStackNavigator';
import { $styles } from '@/theme/styles';

type Props = NativeStackScreenProps<SettingsStackParamList, SettingsPath.ChangePasswordNew>;

export const SettingsChangePasswordNewScreen: FC<Props> = function SettingsChangePasswordNewScreen() {
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    return (
        <Screen preset="fixed" contentContainerStyle={[$styles.screen, $topAlignScreen]} safeAreaEdges={['bottom']}>
            <Header
                title={translate('settingsChangePasswordNewScreen:name')}
                titleMode="flex"
                titleStyle={$rightAlignTitle}
                LeftActionComponent={
                    <BackButton
                        onPress={() => {
                            navigation.goBack();
                        }}
                    />
                }
            />
            <SettingsChangePasswordNew />
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
