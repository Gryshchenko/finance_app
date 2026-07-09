import { useState } from 'react';
import { TextStyle } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BalanceSummary } from '@/components/BalanceSummary';
import { BLUR_FOOTER_HEIGHT, BlurFooter } from '@/components/BlurFooter';
import { DragOverlayProvider } from '@/components/dashboard/Box/DragOverlayContext';
import DashboardItems from '@/components/dashboard/DashboardItems';
import { HeaderV2 } from '@/components/HeaderV2';
import { Screen } from '@/components/Screen';
import { DashboardPath, DashboardStackParamList } from '@/navigators/DashboardStackNavigator';
import { $styles } from '@/theme/styles';

type Props = NativeStackScreenProps<DashboardStackParamList, DashboardPath.Overview>;

// The header floats as a blur overlay, so the list scrolls beneath it. Sharing the
// measured header height keeps the scroll content padded exactly clear of the overlay.
function DashboardContent() {
    const [headerHeight, setHeaderHeight] = useState(0);

    return (
        <>
            <DashboardItems contentPaddingTop={headerHeight} contentPaddingBottom={BLUR_FOOTER_HEIGHT} />
            <HeaderV2 tx={'dashboardScreen:dashboard'} onHeightChange={setHeaderHeight}>
                <BalanceSummary />
            </HeaderV2>
            <BlurFooter />
        </>
    );
}

export const DashboardScreen = function IncomesScreen(_props: Props) {
    return (
        <Screen preset="fixed" contentContainerStyle={[$styles.screen, $topAlignScreen]} safeAreaEdges={['top']}>
            <DragOverlayProvider>
                <DashboardContent />
            </DragOverlayProvider>
        </Screen>
    );
};

const $topAlignScreen: TextStyle = {
    justifyContent: 'flex-start',
};
