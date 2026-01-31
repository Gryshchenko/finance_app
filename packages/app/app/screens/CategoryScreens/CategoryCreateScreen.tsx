import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CategoryCreate } from '@/components/category/CategoryCreate';
import { translate } from '@/i18n/translate';
import { CategoriesPath } from '@/navigators/CategoriesStackNavigator';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';

type Props = NativeStackScreenProps<OverviewTabParamList, CategoriesPath.CategoriesCreate>;

export const CategoryCreateScreen = function CategoryCreateScreen(_props: Props) {
    const navigation = useNavigation();
    return (
        <GenericListScreen
            name={translate('common:new')}
            isError={false}
            isPending={false}
            onBack={() =>
                navigation.getParent()?.navigate('expenses', {
                    screen: 'categories',
                })
            }
            props={{
                data: undefined,
            }}
            RenderComponent={CategoryCreate}
        />
    );
};
