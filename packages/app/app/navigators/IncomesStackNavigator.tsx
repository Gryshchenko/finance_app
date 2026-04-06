import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TransactionFieldType } from 'tenpercent/shared';

import { IncomeCreateScreen } from '@/screens/IncomeScreens/IncomeCreateScreen';
import { IncomeEditScreen } from '@/screens/IncomeScreens/IncomeEditScreen';
import { IncomesScreen } from '@/screens/IncomeScreens/IncomesScreen';
import { TransactionCreateScreen } from '@/screens/TransactionsScreen/TransactionCreateScreen';
import { TransactionEditScreen } from '@/screens/TransactionsScreen/TransactionEditScreen';
import { TransactionsScreen } from '@/screens/TransactionsScreen/TransactionsScreen';
import { TransactionPath } from '@/types/TransactionPath';

const IncomesStack = createNativeStackNavigator();

export enum IncomePath {
    Incomes = 'accounts',
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
            <IncomesStack.Screen name={IncomePath.IncomeCreate} component={IncomeCreateScreen} />
            <IncomesStack.Screen name={IncomePath.IncomeEdit} component={IncomeEditScreen} />
            <IncomesStack.Screen name={TransactionPath.Transactions} component={TransactionsScreen} />
            <IncomesStack.Screen name={TransactionPath.TransactionEdit} component={TransactionEditScreen} />
            <IncomesStack.Screen name={TransactionPath.TransactionCreate} component={TransactionCreateScreen} />
        </IncomesStack.Navigator>
    );
}
export { IncomesStackNavigator };
