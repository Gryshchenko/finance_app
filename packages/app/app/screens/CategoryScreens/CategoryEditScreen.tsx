import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ICategory } from 'tenpercent/shared';

import { CategoryEdit } from '@/components/category/CategoryEdit';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { CategoriesPath } from '@/navigators/CategoriesStackNavigator';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { fetchCategory } from '@/screens/CategoryScreens/CategoryViewScreen';
import { GenericListScreen } from '@/screens/GenericListScreen';

type Props = NativeStackScreenProps<OverviewTabParamList, CategoriesPath.CategoryEdit>;

export const CategoryEditScreen = function CategoryEditScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string; payload: string };
    const { isError, data, isPending } = useAppQuery<ICategory | undefined>(['category', params?.id], () =>
        fetchCategory(params?.id),
    );

    return (
        <GenericListScreen
            name={data?.categoryName ?? translate('categoryScreen:editTitle')}
            isError={isError}
            isPending={isPending}
            onBack={undefined}
            props={{
                data,
            }}
            RenderComponent={CategoryEdit}
        />
    );
};
