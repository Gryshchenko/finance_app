import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CategoryCreate } from '@/components/category/CategoryCreate';
import { translate } from '@/i18n/translate';
import { CategoriesPath, CategoriesStackParamList } from '@/navigators/CategoriesStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';

type Props = NativeStackScreenProps<CategoriesStackParamList, CategoriesPath.CategoriesCreate>;

export const CategoryCreateScreen = function CategoryCreateScreen(_props: Props) {
    return (
        <GenericListScreen
            name={translate('categoryScreen:createTitle')}
            isError={false}
            isPending={false}
            props={{
                data: undefined,
            }}
            RenderComponent={CategoryCreate}
        />
    );
};
