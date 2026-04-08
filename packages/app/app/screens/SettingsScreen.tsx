import { FC } from 'react';
import { TextStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { BackButton } from '@/components/BackButton';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Settings } from '@/components/settings/Settings';
import { translate } from '@/i18n/translate';
import { DashboardPath } from '@/navigators/DashboardStackNavigator';
import { MainTabScreenProps } from '@/navigators/OverviewNavigator';
import { $styles } from '@/theme/styles';
import { OverviewPath } from '@/types/OverviewPath';

export const SettingsScreen: FC<MainTabScreenProps<'settings'>> = function SettingsScreen(_props) {
    const navigation = useNavigation();
    return (
        <Screen preset="fixed" contentContainerStyle={[$styles.screen, $topAlignScreen]} safeAreaEdges={['bottom']}>
            <Header
                title={translate('settingsScreen:name')}
                titleMode="flex"
                titleStyle={$rightAlignTitle}
                LeftActionComponent={
                    <BackButton
                        onPress={() => {
                            navigation.navigate(OverviewPath.Dashboard, { screen: DashboardPath.Overview });
                        }}
                    />
                }
                RightActionComponent={undefined}
            />

            <Settings />
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
