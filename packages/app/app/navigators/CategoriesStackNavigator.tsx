import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TransactionFieldType } from 'tenpercent/shared';

import { CategoriesScreen } from '@/screens/CategoryScreens/CategoriesScreen';
import { CategoryCreateScreen } from '@/screens/CategoryScreens/CategoryCreateScreen';
import { CategoryEditScreen } from '@/screens/CategoryScreens/CategoryEditScreen';
import { CategoryViewScreen } from '@/screens/CategoryScreens/CategoryViewScreen';
import { TransactionCreateScreen } from '@/screens/TransactionsScreen/TransactionCreateScreen';
import { TransactionEditScreen } from '@/screens/TransactionsScreen/TransactionEditScreen';
import { TransactionsScreen } from '@/screens/TransactionsScreen/TransactionsScreen';
import { TransactionPath } from '@/types/TransactionPath';

export enum CategoriesPath {
    Categories = 'categories',
    CategoryView = 'categoryView',
    CategoryEdit = 'categoryEdit',
    CategoriesCreate = 'categoryCreate',
    Transactions = 'transactions',
}
export type CategoriesStackParamList = {
    categories: undefined;
    transactions: { id: number; type: TransactionFieldType; name: string };
    categoryView: { id: number; name: string };
    categoryEdit: { id: number; name: string; payload: string };
    categoryCreate: { payload: string } | undefined;
    transactionCreate: { payload: Record<string, unknown> } | undefined;
    transactionEdit: { id: number; name: string; type: TransactionFieldType };
};

const CategoriesStack = createNativeStackNavigator<CategoriesStackParamList>();

function CategoriesStackNavigator() {
    return (
        <CategoriesStack.Navigator screenOptions={{ headerShown: false }}>
            <CategoriesStack.Screen name={CategoriesPath.Categories} component={CategoriesScreen} />
            <CategoriesStack.Screen name={CategoriesPath.CategoryView} component={CategoryViewScreen} />
            <CategoriesStack.Screen name={CategoriesPath.CategoriesCreate} component={CategoryCreateScreen} />
            <CategoriesStack.Screen name={CategoriesPath.CategoryEdit} component={CategoryEditScreen} />
            <CategoriesStack.Screen name={TransactionPath.Transactions} component={TransactionsScreen} />
            <CategoriesStack.Screen name={TransactionPath.TransactionEdit} component={TransactionEditScreen} />
            <CategoriesStack.Screen name={TransactionPath.TransactionCreate} component={TransactionCreateScreen} />
        </CategoriesStack.Navigator>
    );
}
export { CategoriesStackNavigator };
