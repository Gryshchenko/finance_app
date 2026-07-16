import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DashboardScreen } from '@/screens/DashboardScreen/DashboardScreen';
import { BalanceInsightsScreen } from '@/screens/InsightsScreens/BalanceInsightsScreen';

const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();

export enum DashboardPath {
    Overview = 'overview',
    Insights = 'insights',
}

export type DashboardStackParamList = {
    overview: undefined;
    insights: undefined;
};

function DashboardStackNavigator() {
    return (
        <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
            <DashboardStack.Screen name={DashboardPath.Overview} component={DashboardScreen} />
            <DashboardStack.Screen name={DashboardPath.Insights} component={BalanceInsightsScreen} />
        </DashboardStack.Navigator>
    );
}
export { DashboardStackNavigator };
