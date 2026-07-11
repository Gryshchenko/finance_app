import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatsType, TransactionFieldType } from '@tenpercent/shared';

import { TransactionCreateScreen } from '@/screens/TransactionsScreen/TransactionCreateScreen';
import { TransactionEditScreen } from '@/screens/TransactionsScreen/TransactionEditScreen';
import { TransactionsScreen } from '@/screens/TransactionsScreen/TransactionsScreen';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';

const TransactionStack = createNativeStackNavigator<TransactionStackParamList>();

export type TransactionStackParamList = {
    transactionItems: {
        id: number;
        name: string;
        type: TransactionFieldType;
        path: OverviewPath;
        statsType: StatsType;
        currencyCode: string;
    };
    transactionCreate: { payload: Record<string, unknown> } | undefined;
    transactionEdit: { id: number; name: string; payload: string };
};

function TransactionStackNavigator() {
    return (
        <TransactionStack.Navigator screenOptions={{ headerShown: false }}>
            <TransactionStack.Screen name={TransactionPath.Transactions} component={TransactionsScreen} />
            <TransactionStack.Screen name={TransactionPath.TransactionCreate} component={TransactionCreateScreen} />
            <TransactionStack.Screen name={TransactionPath.TransactionEdit} component={TransactionEditScreen} />
        </TransactionStack.Navigator>
    );
}
export { TransactionStackNavigator };
