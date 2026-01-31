import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ICategory } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';

import { CategoryView } from '@/components/category/CategoryView';
import { useAppQuery } from '@/hooks/useAppQuery';
import { CategoriesPath } from '@/navigators/CategoriesStackNavigator';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { CategoryService } from '@/services/CategoryService';
import { ValidationError } from '@/utils/errors/ValidationError';
import { Logger } from '@/utils/logger/Logger';

export async function fetchCategory(id: number): Promise<ICategory | undefined> {
    try {
        if (Utils.isNull(id)) {
            throw new ValidationError({
                message: 'ID = null',
            });
        }
        const categoryService = CategoryService.instance();
        const response = await categoryService.doGetCategory(id);
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as ICategory;
            }
            default: {
                return undefined;
            }
        }
    } catch (e) {
        Logger.Of('FetchCategorys').error(`Fetch categoryId ${id}  failed due reason: ${(e as { message: string }).message}`);
        return undefined;
    }
}

type Props = NativeStackScreenProps<OverviewTabParamList, CategoriesPath.CategoryView>;

export const CategoryViewScreen = function CategoryViewScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string };
    const navigation = useNavigation();
    const { isError, data, isPending } = useAppQuery<ICategory | undefined>(['category', params?.id], () =>
        fetchCategory(params?.id),
    );

    return (
        <GenericListScreen
            name={data?.categoryName ?? ''}
            isError={isError}
            isPending={isPending}
            onBack={() =>
                navigation.getParent()?.navigate('expenses', {
                    screen: 'categories',
                })
            }
            props={{
                data,
            }}
            RenderComponent={CategoryView}
        />
    );
};
