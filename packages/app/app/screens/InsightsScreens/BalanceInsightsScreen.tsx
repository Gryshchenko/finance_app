import { useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, TextStyle } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSharedValue } from 'react-native-reanimated';

import { BackButton } from '@/components/BackButton';
import { BLUR_FOOTER_HEIGHT, BlurFooter } from '@/components/BlurFooter';
import { Header } from '@/components/Header';
import { BalanceInsights } from '@/components/insights/BalanceInsights';
import { Screen } from '@/components/Screen';
import { ScrollBlurHeader } from '@/components/ScrollBlurHeader';
import { translate } from '@/i18n/translate';
import { DashboardPath, DashboardStackParamList } from '@/navigators/DashboardStackNavigator';
import { spacing } from '@/theme/spacing';
import { $styles } from '@/theme/styles';

type Props = NativeStackScreenProps<DashboardStackParamList, DashboardPath.Insights>;

export const BalanceInsightsScreen = function BalanceInsightsScreen({ navigation }: Props) {
    // Drives the pinned header's opaque->blur cross-fade as the content scrolls beneath it.
    const scrollY = useSharedValue(0);
    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollY.value = event.nativeEvent.contentOffset.y;
    };
    const [headerHeight, setHeaderHeight] = useState(0);

    return (
        <Screen preset="fixed" contentContainerStyle={[$styles.screen, $topAlignScreen]}>
            <BalanceInsights onScroll={onScroll} contentPaddingTop={headerHeight} contentPaddingBottom={BLUR_FOOTER_HEIGHT} />

            <ScrollBlurHeader
                scrollY={scrollY}
                onHeightChange={setHeaderHeight}
                topInset={spacing.lg}
                childrenStyles={{ paddingHorizontal: spacing.lg * 2 }}
            >
                <Header
                    title={translate('insights:title')}
                    titleMode="flex"
                    titleStyle={$centerTitle}
                    backgroundColor="transparent"
                    LeftActionComponent={<BackButton onPress={() => navigation.navigate(DashboardPath.Overview)} />}
                />
            </ScrollBlurHeader>

            <BlurFooter />
        </Screen>
    );
};

const $centerTitle: TextStyle = {
    textAlign: 'center',
    textTransform: 'uppercase',
};

const $topAlignScreen: TextStyle = {
    justifyContent: 'flex-start',
};
