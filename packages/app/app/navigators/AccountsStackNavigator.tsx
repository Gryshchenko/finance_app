import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TransactionFieldType } from 'tenpercent/shared';

import { AccountCreateScreen } from '@/screens/AccountScreens/AccountCreateScreen';
import { AccountEditScreen } from '@/screens/AccountScreens/AccountEditScreen';
import { AccountsScreen } from '@/screens/AccountScreens/AccountsScreen';
import { AccountViewScreen } from '@/screens/AccountScreens/AccountViewScreen';
import { HistoryTransactionEditScreen } from '@/screens/HistoryScreen/HistoryTransactionEditScreen';
import { TransactionCreateScreen } from '@/screens/TransactionsScreen/TransactionCreateScreen';
import { TransactionsScreen } from '@/screens/TransactionsScreen/TransactionsScreen';
import { TransactionViewScreen } from '@/screens/TransactionsScreen/TransactionViewScreen';
import { TransactionPath } from '@/types/TransactionPath';

const AccountsStack = createNativeStackNavigator();

export enum AccountsPath {
    Accounts = 'accounts',
    AccountView = 'accountView',
    AccountEdit = 'accountEdit',
    AccountsCreate = 'accountCreate',
    Transactions = 'transactions',
}
export interface AccountsStackParamList {
    accounts: undefined;
    transactions: { id: number; type: TransactionFieldType; name: string };
    transaction: { id: number };
    view: { id: number; name: string };
    edit: { id: number; name: string; payload: string };
    create: { payload: string };
}

function AccountsStackNavigator() {
    return (
        <AccountsStack.Navigator screenOptions={{ headerShown: false }}>
            <AccountsStack.Screen name={AccountsPath.Accounts} component={AccountsScreen} />
            <AccountsStack.Screen name={TransactionPath.Transactions} component={TransactionsScreen} />
            <AccountsStack.Screen name={AccountsPath.AccountView} component={AccountViewScreen} />
            <AccountsStack.Screen name={AccountsPath.AccountsCreate} component={AccountCreateScreen} />
            <AccountsStack.Screen name={AccountsPath.AccountEdit} component={AccountEditScreen} />
            <AccountsStack.Screen name={TransactionPath.TransactionEdit} component={HistoryTransactionEditScreen} />
            <AccountsStack.Screen name={TransactionPath.TransactionView} component={TransactionViewScreen} />
            <AccountsStack.Screen name={TransactionPath.TransactionCreate} component={TransactionCreateScreen} />
        </AccountsStack.Navigator>
    );
}
export { AccountsStackNavigator };
