import { FC } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ICategory } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';

import { CategoryFields } from '@/components/category/CategoryFields';
import { EmptyState } from '@/components/EmptyState';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { CategoriesPath } from '@/navigators/CategoriesStackNavigator';
import { categoryEditSchema } from '@/schems/validationSchemas';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { CategoryService } from '@/services/CategoryService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

interface ICategoryPros {
    data: Partial<ICategory> | undefined;
}

export const CategoryEdit: FC<ICategoryPros> = function CategoryEdit(_props) {
    const { data } = _props;
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, save, errors } = useEditView<Partial<ICategory>>(data!, categoryEditSchema);

    const handlePatch = async () => {
        const categoryService = CategoryService.instance();
        if (Utils.isEmpty(form.categoryName)) return;
        if (Utils.isNull(form.categoryId)) return;

        const response = await categoryService.doPatchCategory(form.categoryId!, {
            categoryName: form.categoryName!,
            iconId: form.iconId,
        });
        if (response.kind === GeneralApiProblemKind.Ok) {
            ToastService.info({
                title: 'common:info',
                message: 'categoryScreen:updateCategorySuccess',
            });
            await invalidateQuery([['categories']]);
            await invalidateQuery([['category', form.categoryId]]);
            navigation.getParent()?.navigate(OverviewPath.Dashboard);
        } else {
            ToastService.error({
                title: 'common:error',
                message: 'categoryScreen:updateCategoryFailed',
            });
        }
    };

    const handleSave = async () => {
        await save();
        await handlePatch();
    };
    if (!data) {
        return <EmptyState style={$containerStyleOverride} buttonOnPress={() => navigation.goBack()} />;
    }

    return (
        <CategoryFields
            form={form}
            isCreate={false}
            isEdit={true}
            errors={errors}
            isView={false}
            handleChange={(key: string, value: string | number) => {
                handleChange(key as keyof ICategory, value);
            }}
            cancel={() => {
                navigation.getParent()?.navigate(OverviewPath.Categories, {
                    screen: CategoriesPath.CategoryView,
                    params: { id: form.categoryId, name: form.categoryName },
                });
            }}
            handleSave={handleSave}
        />
    );
};
const $containerStyleOverride: StyleProp<ViewStyle> = {
    margin: 'auto',
};
