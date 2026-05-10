import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TransactionFieldType } from 'tenpercent/shared';

import { IncomeCreateScreen } from '@/screens/IncomeScreens/IncomeCreateScreen';
import { IncomeEditScreen } from '@/screens/IncomeScreens/IncomeEditScreen';
import { IncomesScreen } from '@/screens/IncomeScreens/IncomesScreen';
import { IncomeViewScreen } from '@/screens/IncomeScreens/IncomeViewScreen';
import { TransactionCreateScreen } from '@/screens/TransactionsScreen/TransactionCreateScreen';
import { TransactionEditScreen } from '@/screens/TransactionsScreen/TransactionEditScreen';
import { TransactionsScreen } from '@/screens/TransactionsScreen/TransactionsScreen';
import { TransactionPath } from '@/types/TransactionPath';

export enum IncomePath {
    Incomes = 'incomes',
    IncomeView = 'incomeView',
    IncomeEdit = 'incomeEdit',
    IncomeCreate = 'incomeCreate',
    Transactions = 'transactions',
}

export type IncomesStackParamList = {
    incomes: undefined;
    transactions: { id: number; type: TransactionFieldType; name: string };
    incomeView: { id: number; name: string };
    incomeEdit: { id: number; name: string; payload: string };
    incomeCreate: { payload: string } | undefined;
    transactionCreate: { payload: Record<string, unknown> } | undefined;
    transactionEdit: { id: number; name: string; type: TransactionFieldType };
};

const IncomesStack = createNativeStackNavigator<IncomesStackParamList>();

function IncomesStackNavigator() {
    return (
        <IncomesStack.Navigator screenOptions={{ headerShown: false }}>
            <IncomesStack.Screen name={IncomePath.Incomes} component={IncomesScreen} />
            <IncomesStack.Screen name={IncomePath.IncomeView} component={IncomeViewScreen} />
            <IncomesStack.Screen name={IncomePath.IncomeCreate} component={IncomeCreateScreen} />
            <IncomesStack.Screen name={IncomePath.IncomeEdit} component={IncomeEditScreen} />
            <IncomesStack.Screen name={TransactionPath.Transactions} component={TransactionsScreen} />
            <IncomesStack.Screen name={TransactionPath.TransactionEdit} component={TransactionEditScreen} />
            <IncomesStack.Screen name={TransactionPath.TransactionCreate} component={TransactionCreateScreen} />
        </IncomesStack.Navigator>
    );
}
export { IncomesStackNavigator };
