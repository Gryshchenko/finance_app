import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DashboardScreen } from '@/screens/DashboardScreen/DashboardScreen';

const DashboardStack = createNativeStackNavigator();

export enum DashboardPath {
    Overview = '/',
}

export interface DashboardStackParamList {
    Overview: undefined;
}

function DashboardStackNavigator() {
    return (
        <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
            <DashboardStack.Screen name={DashboardPath.Overview} component={DashboardScreen} />
        </DashboardStack.Navigator>
    );
}
export { DashboardStackNavigator };
