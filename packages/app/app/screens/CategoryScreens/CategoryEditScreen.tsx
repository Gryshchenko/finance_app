import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ICategory } from 'tenpercent/shared';

import { CategoryEdit } from '@/components/category/CategoryEdit';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { CategoriesPath, CategoriesStackParamList } from '@/navigators/CategoriesStackNavigator';
import { fetchCategory } from '@/screens/CategoryScreens/CategoryViewScreen';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';

type Props = NativeStackScreenProps<CategoriesStackParamList, CategoriesPath.CategoryEdit>;

export const CategoryEditScreen = function CategoryEditScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string; payload: string };
    const { isError, data, isPending } = useAppQuery<ICategory | undefined>(
        QueryKeys.category(params?.id),
        () => fetchCategory(params?.id),
        { staleTime: QueryStaleTimes.detail },
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
