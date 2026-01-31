import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HistoryTransactionCreateScreen } from '@/screens/HistoryScreen/HistoryTransactionCreateScreen';
import { HistoryTransactionEditScreen } from '@/screens/HistoryScreen/HistoryTransactionEditScreen';
import { HistoryTransactionsScreen } from '@/screens/HistoryScreen/HistoryTransactionsScreen';
import { HistoryTransactionViewScreen } from '@/screens/HistoryScreen/HistoryTransactionViewScreen';
import { TransactionPath } from '@/types/TransactionPath';

const BalancesStack = createNativeStackNavigator();

export interface HistoryStackParamList {
    transactions: undefined;
    transaction: { id: number };
}

function HistoryStackNavigator() {
    return (
        <BalancesStack.Navigator screenOptions={{ headerShown: false }}>
            <BalancesStack.Screen name={TransactionPath.Transactions} component={HistoryTransactionsScreen} />
            <BalancesStack.Screen name={TransactionPath.TransactionView} component={HistoryTransactionViewScreen} />
            <BalancesStack.Screen name={TransactionPath.TransactionCreate} component={HistoryTransactionCreateScreen} />
            <BalancesStack.Screen name={TransactionPath.TransactionEdit} component={HistoryTransactionEditScreen} />
        </BalancesStack.Navigator>
    );
}
export { HistoryStackNavigator };
