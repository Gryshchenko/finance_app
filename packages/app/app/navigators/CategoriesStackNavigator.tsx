import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TransactionFieldType } from 'tenpercent/shared';

import { CategoriesScreen } from '@/screens/CategoryScreens/CategoriesScreen';
import { CategoryCreateScreen } from '@/screens/CategoryScreens/CategoryCreateScreen';
import { CategoryEditScreen } from '@/screens/CategoryScreens/CategoryEditScreen';
import { CategoryViewScreen } from '@/screens/CategoryScreens/CategoryViewScreen';
import { HistoryTransactionEditScreen } from '@/screens/HistoryScreen/HistoryTransactionEditScreen';
import { TransactionCreateScreen } from '@/screens/TransactionsScreen/TransactionCreateScreen';
import { TransactionsScreen } from '@/screens/TransactionsScreen/TransactionsScreen';
import { TransactionViewScreen } from '@/screens/TransactionsScreen/TransactionViewScreen';
import { TransactionPath } from '@/types/TransactionPath';

const CategoriesStack = createNativeStackNavigator();

export enum CategoriesPath {
    Categories = 'categories',
    CategoryView = 'categoryView',
    CategoryEdit = 'categoryEdit',
    CategoriesCreate = 'categoryCreate',
    Transactions = 'transactions',
}
export interface CategoriesStackParamList {
    categories: undefined;
    transactions: { id: number; type: TransactionFieldType; name: string };
    transaction: { id: number };
    view: { id: number; name: string };
    edit: { id: number; name: string; payload: string };
    create: { payload: string };
}

function CategoriesStackNavigator() {
    return (
        <CategoriesStack.Navigator screenOptions={{ headerShown: false }}>
            <CategoriesStack.Screen name={CategoriesPath.Categories} component={CategoriesScreen} />
            <CategoriesStack.Screen name={CategoriesPath.CategoryView} component={CategoryViewScreen} />
            <CategoriesStack.Screen name={CategoriesPath.CategoriesCreate} component={CategoryCreateScreen} />
            <CategoriesStack.Screen name={CategoriesPath.CategoryEdit} component={CategoryEditScreen} />
            <CategoriesStack.Screen name={TransactionPath.Transactions} component={TransactionsScreen} />
            <CategoriesStack.Screen name={TransactionPath.TransactionEdit} component={HistoryTransactionEditScreen} />
            <CategoriesStack.Screen name={TransactionPath.TransactionView} component={TransactionViewScreen} />
            <CategoriesStack.Screen name={TransactionPath.TransactionCreate} component={TransactionCreateScreen} />
        </CategoriesStack.Navigator>
    );
}
export { CategoriesStackNavigator };
