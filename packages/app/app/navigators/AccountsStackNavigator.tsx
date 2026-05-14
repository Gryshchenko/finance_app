import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TransactionFieldType } from 'tenpercent/shared';

import { AccountCreateScreen } from '@/screens/AccountScreens/AccountCreateScreen';
import { AccountEditScreen } from '@/screens/AccountScreens/AccountEditScreen';
import { TransactionCreateScreen } from '@/screens/TransactionsScreen/TransactionCreateScreen';
import { TransactionEditScreen } from '@/screens/TransactionsScreen/TransactionEditScreen';
import { TransactionsScreen } from '@/screens/TransactionsScreen/TransactionsScreen';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';

export enum AccountsPath {
    Accounts = 'accounts',
    AccountEdit = 'accountEdit',
    AccountsCreate = 'accountCreate',
}

export type AccountsStackParamList = {
    accountEdit: { id: number; name: string; payload: string };

    accountCreate: undefined;

    transactions: {
        id: number;
        name: string;
        type: TransactionFieldType;
        path: OverviewPath;
    };

    transactionCreate: { payload: Record<string, unknown> } | undefined;

    transactionEdit: {
        id: number;
        name: string;
        type: TransactionFieldType;
        path: OverviewPath;
    };
};

const AccountsStack = createNativeStackNavigator<AccountsStackParamList>();

function AccountsStackNavigator() {
    return (
        <AccountsStack.Navigator screenOptions={{ headerShown: false }}>
            <AccountsStack.Screen name={AccountsPath.AccountsCreate} component={AccountCreateScreen} />
            <AccountsStack.Screen name={AccountsPath.AccountEdit} component={AccountEditScreen} />
            <AccountsStack.Screen name={TransactionPath.Transactions} component={TransactionsScreen} />
            <AccountsStack.Screen name={TransactionPath.TransactionCreate} component={TransactionCreateScreen} />
            <AccountsStack.Screen name={TransactionPath.TransactionEdit} component={TransactionEditScreen} />
        </AccountsStack.Navigator>
    );
}

export { AccountsStackNavigator };
