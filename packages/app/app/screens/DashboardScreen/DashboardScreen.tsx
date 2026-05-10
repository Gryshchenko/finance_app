import { TextStyle } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BalanceSummary } from '@/components/BalanceSummary';
import { DragOverlayProvider } from '@/components/dashboard/Box/DragOverlayContext';
import DashboardItems from '@/components/dashboard/DashboardItems';
import { HeaderV2 } from '@/components/HeaderV2';
import { Screen } from '@/components/Screen';
import { DashboardPath, DashboardStackParamList } from '@/navigators/DashboardStackNavigator';
import { $styles } from '@/theme/styles';

type Props = NativeStackScreenProps<DashboardStackParamList, DashboardPath.Overview>;

export const DashboardScreen = function IncomesScreen(_props: Props) {
    return (
        <Screen preset="fixed" contentContainerStyle={[$styles.screen, $topAlignScreen]} safeAreaEdges={['top']}>
            <HeaderV2 tx={'dashboardScreen:dashboard'} />
            <BalanceSummary />
            <DragOverlayProvider>
                <DashboardItems />
            </DragOverlayProvider>
        </Screen>
    );
};

const $topAlignScreen: TextStyle = {
    justifyContent: 'flex-start',
};
