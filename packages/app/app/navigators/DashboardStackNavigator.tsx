import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DashboardScreen } from '@/screens/DashboardScreen/DashboardScreen';

const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();

export enum DashboardPath {
    Overview = 'overview',
}

export type DashboardStackParamList = {
    overview: undefined;
};

function DashboardStackNavigator() {
    return (
        <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
            <DashboardStack.Screen name={DashboardPath.Overview} component={DashboardScreen} />
        </DashboardStack.Navigator>
    );
}
export { DashboardStackNavigator };
