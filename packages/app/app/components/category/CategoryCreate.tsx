import { FC } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ICategory, SpendIcon, Utils } from 'tenpercent/shared';

import { CategoryFields } from '@/components/category/CategoryFields';
import { useEditView } from '@/hooks/useEditView';
import { CategoriesPath } from '@/navigators/CategoriesStackNavigator';
import { categoryCreateSchema } from '@/schems/validationSchemas';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { CategoryService } from '@/services/CategoryService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

export const CategoryCreate: FC = function CategoryCreate(_props) {
    const navigation = useNavigation();
    const { form, handleChange, save, errors } = useEditView<Partial<ICategory>>(
        {
            categoryName: '',
            currencyId: 1,
            iconId: SpendIcon.ShoppingBag,
        },
        categoryCreateSchema,
    );

    const handleCreate = async () => {
        const categoryService = CategoryService.instance();
        if (Utils.isEmpty(form.categoryName) || Utils.isNull(form.currencyId) || Utils.isNull(form.iconId)) {
            ToastService.error({
                message: 'errorCode:UNKNOWN_ERROR',
                systemMessage: `Validation error on create category, categoryName: ${form.categoryName}, currencyId: ${form.currencyId}, iconId: ${form.iconId}`,
            });
            return;
        }

        const response = await categoryService.doCreateCategory({
            categoryName: form.categoryName!,
            currencyId: form.currencyId!,
            iconId: form.iconId ?? SpendIcon.ShoppingBag,
        });
        if (response.kind === GeneralApiProblemKind.Ok) {
            navigation.getParent()?.navigate(OverviewPath.Expenses, {
                screen: 'categories',
            });
        } else {
            ToastService.error({
                message: 'errorCode:UNKNOWN_ERROR',
                systemMessage: `response kind: ${response.kind}, on create category with name: ${form.categoryName}, currencyId: ${form.currencyId}, iconId: ${form.iconId}`,
            });
        }
    };

    const handleSave = async () => {
        await save();
        await handleCreate();
    };

    return (
        <CategoryFields
            form={form}
            isCreate={true}
            isEdit={true}
            errors={errors}
            isView={false}
            handleChange={(key: string, value: string | number) => {
                handleChange(key as keyof ICategory, value);
            }}
            cancel={() => {
                navigation.getParent()?.navigate(OverviewPath.Expenses, {
                    screen: CategoriesPath.CategoryView,
                    params: { id: form.categoryId, name: form.categoryName },
                });
            }}
            handleSave={handleSave}
        />
    );
};
