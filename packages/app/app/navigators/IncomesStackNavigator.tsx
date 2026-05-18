import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { IncomeCreateScreen } from '@/screens/IncomeScreens/IncomeCreateScreen';
import { IncomeEditScreen } from '@/screens/IncomeScreens/IncomeEditScreen';
import type { BackTarget } from '@/types/BackTarget';

export enum IncomePath {
    IncomeEdit = 'incomeEdit',
    IncomeCreate = 'incomeCreate',
}

export type IncomesStackParamList = {
    incomeEdit: { id: number; name: string; payload: string; back?: BackTarget };
    incomeCreate: { payload: string; back?: BackTarget } | undefined;
};

const IncomesStack = createNativeStackNavigator<IncomesStackParamList>();

function IncomesStackNavigator() {
    return (
        <IncomesStack.Navigator screenOptions={{ headerShown: false }}>
            <IncomesStack.Screen name={IncomePath.IncomeCreate} component={IncomeCreateScreen} />
            <IncomesStack.Screen name={IncomePath.IncomeEdit} component={IncomeEditScreen} />
        </IncomesStack.Navigator>
    );
}
export { IncomesStackNavigator };
