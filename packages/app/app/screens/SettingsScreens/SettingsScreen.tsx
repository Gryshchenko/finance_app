import { FC } from 'react';
import { TextStyle } from 'react-native';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BackButton } from '@/components/BackButton';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Settings } from '@/components/settings/Settings';
import { translate } from '@/i18n/translate';
import { DashboardPath } from '@/navigators/DashboardStackNavigator';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { $styles } from '@/theme/styles';
import { OverviewPath } from '@/types/OverviewPath';

type Props = NativeStackScreenProps<ParamListBase, string>;

export const SettingsScreen: FC<Props> = function SettingsScreen(_props) {
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
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
