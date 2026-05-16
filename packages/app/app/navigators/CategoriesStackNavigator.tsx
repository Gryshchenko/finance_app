import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CategoryCreateScreen } from '@/screens/CategoryScreens/CategoryCreateScreen';
import { CategoryEditScreen } from '@/screens/CategoryScreens/CategoryEditScreen';

export enum CategoriesPath {
    CategoryEdit = 'categoryEdit',
    CategoriesCreate = 'categoryCreate',
}
export type CategoriesStackParamList = {
    categoryEdit: { id: number; name: string; payload: string };
    categoryCreate: { payload: string } | undefined;
};

const CategoriesStack = createNativeStackNavigator<CategoriesStackParamList>();

function CategoriesStackNavigator() {
    return (
        <CategoriesStack.Navigator screenOptions={{ headerShown: false }}>
            <CategoriesStack.Screen name={CategoriesPath.CategoriesCreate} component={CategoryCreateScreen} />
            <CategoriesStack.Screen name={CategoriesPath.CategoryEdit} component={CategoryEditScreen} />
        </CategoriesStack.Navigator>
    );
}
export { CategoriesStackNavigator };
