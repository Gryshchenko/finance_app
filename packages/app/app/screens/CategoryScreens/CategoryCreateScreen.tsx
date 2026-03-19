import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CategoryCreate } from '@/components/category/CategoryCreate';
import { translate } from '@/i18n/translate';
import { CategoriesPath } from '@/navigators/CategoriesStackNavigator';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { OverviewPath } from '@/types/OverviewPath';

type Props = NativeStackScreenProps<OverviewTabParamList, CategoriesPath.CategoriesCreate>;

export const CategoryCreateScreen = function CategoryCreateScreen(_props: Props) {
    const navigation = useNavigation();
    return (
        <GenericListScreen
            name={translate('categoryScreen:createTitle')}
            isError={false}
            isPending={false}
            onBack={() => navigation.getParent()?.navigate(OverviewPath.Dashboard)}
            props={{
                data: undefined,
            }}
            RenderComponent={CategoryCreate}
        />
    );
};
