import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CategoryCreateScreen } from '@/screens/CategoryScreens/CategoryCreateScreen';
import { CategoryEditScreen } from '@/screens/CategoryScreens/CategoryEditScreen';
import type { BackTarget } from '@/types/BackTarget';

export enum CategoriesPath {
    CategoryEdit = 'categoryEdit',
    CategoriesCreate = 'categoryCreate',
}

export type CategoriesStackParamList = {
    categoryEdit: {
        id: number;
        name: string;
        payload: string;
        back?: BackTarget;
    };
    categoryCreate: { payload: string; back?: BackTarget } | undefined;
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
