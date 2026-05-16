import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AccountCreateScreen } from '@/screens/AccountScreens/AccountCreateScreen';
import { AccountEditScreen } from '@/screens/AccountScreens/AccountEditScreen';

export enum AccountsPath {
    AccountEdit = 'accountEdit',
    AccountsCreate = 'accountCreate',
}

export type AccountsStackParamList = {
    accountEdit: { id: number; name: string; payload: string };
    accountCreate: undefined;
};

const AccountsStack = createNativeStackNavigator<AccountsStackParamList>();

function AccountsStackNavigator() {
    return (
        <AccountsStack.Navigator screenOptions={{ headerShown: false }}>
            <AccountsStack.Screen name={AccountsPath.AccountsCreate} component={AccountCreateScreen} />
            <AccountsStack.Screen name={AccountsPath.AccountEdit} component={AccountEditScreen} />
        </AccountsStack.Navigator>
    );
}

export { AccountsStackNavigator };
