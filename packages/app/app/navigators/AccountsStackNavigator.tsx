import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TransactionFieldType } from 'tenpercent/shared';

import { AccountCreateScreen } from '@/screens/AccountScreens/AccountCreateScreen';
import { AccountEditScreen } from '@/screens/AccountScreens/AccountEditScreen';
import { AccountsScreen } from '@/screens/AccountScreens/AccountsScreen';
import { TransactionCreateScreen } from '@/screens/TransactionsScreen/TransactionCreateScreen';
import { TransactionEditScreen } from '@/screens/TransactionsScreen/TransactionEditScreen';
import { TransactionsScreen } from '@/screens/TransactionsScreen/TransactionsScreen';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';

const AccountsStack = createNativeStackNavigator();

export enum AccountsPath {
    Accounts = 'accounts',
    AccountEdit = 'accountEdit',
    AccountsCreate = 'accountCreate',
}

/**
 * Full param list for every screen registered in AccountsStackNavigator.
 *
 * Key names must match the `name` prop of the corresponding Stack.Screen.
 * Transaction screens are shared across navigators and keep their
 * TransactionPath string values as keys.
 */
export interface AccountsStackParamList {
    /** Main accounts list — no params required. */
    accounts: undefined;

    /** Read-only detail view of a single account. */
    accountView: { id: number; name: string };

    /** Edit form for an existing account. */
    accountEdit: { id: number; name: string; payload: string };

    /** Create-account form — no incoming params required. */
    accountCreate: undefined;

    /**
     * Shared transaction list, filtered by entity.
     * `path` identifies which parent tab should receive nested navigation
     * when the user opens a transaction detail / edit flow.
     */
    transactions: {
        id: number;
        name: string;
        type: TransactionFieldType;
        path: OverviewPath;
    };

    /**
     * Shared create-transaction screen.
     * `payload` carries pre-filled transaction fields (account, income, type, …).
     * Passed as a plain object; the screen uses Utils.parseObject to deserialise.
     */
    transactionCreate: { payload: Record<string, unknown> } | undefined;

    /** Shared edit-transaction screen. */
    transactionEdit: {
        id: number;
        name: string;
        type: TransactionFieldType;
        path: OverviewPath;
    };
}

function AccountsStackNavigator() {
    return (
        <AccountsStack.Navigator screenOptions={{ headerShown: false }}>
            <AccountsStack.Screen name={AccountsPath.Accounts} component={AccountsScreen} />
            <AccountsStack.Screen name={AccountsPath.AccountsCreate} component={AccountCreateScreen} />
            <AccountsStack.Screen name={AccountsPath.AccountEdit} component={AccountEditScreen} />

            <AccountsStack.Screen name={TransactionPath.Transactions} component={TransactionsScreen} />
            <AccountsStack.Screen name={TransactionPath.TransactionCreate} component={TransactionCreateScreen} />
            <AccountsStack.Screen name={TransactionPath.TransactionEdit} component={TransactionEditScreen} />
        </AccountsStack.Navigator>
    );
}

export { AccountsStackNavigator };
