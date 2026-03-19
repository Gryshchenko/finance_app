import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TransactionFieldType } from 'tenpercent/shared';

import { HistoryTransactionEditScreen } from '@/screens/HistoryScreen/HistoryTransactionEditScreen';
import { IncomeCreateScreen } from '@/screens/IncomeScreens/IncomeCreateScreen';
import { IncomeEditScreen } from '@/screens/IncomeScreens/IncomeEditScreen';
import { IncomesScreen } from '@/screens/IncomeScreens/IncomesScreen';
import { IncomeViewScreen } from '@/screens/IncomeScreens/IncomeViewScreen';
import { TransactionCreateScreen } from '@/screens/TransactionsScreen/TransactionCreateScreen';
import { TransactionsScreen } from '@/screens/TransactionsScreen/TransactionsScreen';
import { TransactionViewScreen } from '@/screens/TransactionsScreen/TransactionViewScreen';
import { TransactionPath } from '@/types/TransactionPath';

const IncomesStack = createNativeStackNavigator();

export enum IncomePath {
    Incomes = 'accounts',
    IncomeView = 'incomeView',
    IncomeEdit = 'incomeEdit',
    IncomeCreate = 'incomeCreate',
    Transactions = 'transactions',
}

export interface IncomesStackParamList {
    accounts: undefined;
    transactions: { id: number; type: TransactionFieldType; name: string };
    incomeView: { id: number; name: string };
    incomeEdit: { id: number; name: string; payload: string };
    incomeCreate: { payload: string };
}

function IncomesStackNavigator() {
    return (
        <IncomesStack.Navigator screenOptions={{ headerShown: false }}>
            <IncomesStack.Screen name={IncomePath.Incomes} component={IncomesScreen} />
            <IncomesStack.Screen name={IncomePath.IncomeView} component={IncomeViewScreen} />
            <IncomesStack.Screen name={IncomePath.IncomeCreate} component={IncomeCreateScreen} />
            <IncomesStack.Screen name={IncomePath.IncomeEdit} component={IncomeEditScreen} />
            <IncomesStack.Screen name={TransactionPath.Transactions} component={TransactionsScreen} />
        </IncomesStack.Navigator>
    );
}
export { IncomesStackNavigator };
