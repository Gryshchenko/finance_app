import { TextStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BalanceSummary } from '@/components/BalanceSummary';
import DashboardItems from '@/components/dashboard/DashboardItems';
import { HeaderV2 } from '@/components/HeaderV2';
import { Screen } from '@/components/Screen';
import { DashboardPath } from '@/navigators/DashboardStackNavigator';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { $styles } from '@/theme/styles';

type Props = NativeStackScreenProps<OverviewTabParamList, DashboardPath.Overview>;

export const DashboardScreen = function IncomesScreen(_props: Props) {
    const navigation = useNavigation();

    return (
        <Screen preset="fixed" contentContainerStyle={[$styles.screen, $topAlignScreen]} safeAreaEdges={['top']}>
            <HeaderV2 tx={'dashboardScreen:dashboard'} />
            <BalanceSummary />
            <DashboardItems />
        </Screen>
    );
};

const $topAlignScreen: TextStyle = {
    justifyContent: 'flex-start',
};
