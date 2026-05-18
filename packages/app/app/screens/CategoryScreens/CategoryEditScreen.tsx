import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ICategory, Utils } from 'tenpercent/shared';

import { CategoryEdit } from '@/components/category/CategoryEdit';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { CategoriesPath, CategoriesStackParamList } from '@/navigators/CategoriesStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { CategoryService } from '@/services/CategoryService';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import type { BackTarget } from '@/types/BackTarget';
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
type Props = NativeStackScreenProps<CategoriesStackParamList, CategoriesPath.CategoryEdit>;

export const CategoryEditScreen = function CategoryEditScreen(_props: Props) {
    const params = _props?.route?.params as {
        id: number;
        name: string;
        payload: string;
        back?: BackTarget;
    };
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
            props={{
                data,
                back: params?.back,
            }}
            RenderComponent={CategoryEdit}
        />
    );
};
