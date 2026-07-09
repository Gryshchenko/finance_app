import { FC, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, TextStyle } from 'react-native';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSharedValue } from 'react-native-reanimated';

import { BackButton } from '@/components/BackButton';
import { BLUR_FOOTER_HEIGHT, BlurFooter } from '@/components/BlurFooter';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { ScrollBlurHeader } from '@/components/ScrollBlurHeader';
import { Settings } from '@/components/settings/Settings';
import { translate } from '@/i18n/translate';
import { DashboardPath } from '@/navigators/DashboardStackNavigator';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { spacing } from '@/theme/spacing';
import { $styles } from '@/theme/styles';
import { OverviewPath } from '@/types/OverviewPath';

type Props = NativeStackScreenProps<ParamListBase, string>;

export const SettingsScreen: FC<Props> = function SettingsScreen(_props) {
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();

    // Drives the pinned header's opaque->blur cross-fade as the settings list scrolls.
    const scrollY = useSharedValue(0);
    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollY.value = event.nativeEvent.contentOffset.y;
    };
    const [headerHeight, setHeaderHeight] = useState(0);

    return (
        <Screen preset="fixed" contentContainerStyle={[$styles.screen, $topAlignScreen]}>
            <Settings onScroll={onScroll} contentPaddingTop={headerHeight} contentPaddingBottom={BLUR_FOOTER_HEIGHT} />

            <ScrollBlurHeader
                scrollY={scrollY}
                onHeightChange={setHeaderHeight}
                topInset={spacing.lg}
                childrenStyles={{ paddingHorizontal: spacing.lg * 2 }}
            >
                <Header
                    title={translate('settingsScreen:name')}
                    titleMode="flex"
                    titleStyle={$rightAlignTitle}
                    backgroundColor="transparent"
                    LeftActionComponent={
                        <BackButton
                            onPress={() => {
                                navigation.navigate(OverviewPath.Dashboard, { screen: DashboardPath.Overview });
                            }}
                        />
                    }
                    RightActionComponent={undefined}
                />
            </ScrollBlurHeader>

            <BlurFooter />
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
