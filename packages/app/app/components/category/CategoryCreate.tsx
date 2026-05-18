import { FC } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ICategory, SpendIcon, Utils } from 'tenpercent/shared';

import { CategoryFields } from '@/components/category/CategoryFields';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { categoryCreateSchema } from '@/schems/validationSchemas';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { CategoryService } from '@/services/CategoryService';
import { InvalidationGroups } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

export const CategoryCreate: FC = function CategoryCreate(_props) {
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, save, errors, setErrors } = useEditView<Partial<ICategory>>(
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
            budget: form.budget ?? undefined,
        });
        if (response.kind === GeneralApiProblemKind.Ok) {
            await invalidateQuery(InvalidationGroups.category());
            navigation.getParent()?.navigate(OverviewPath.Dashboard);
        } else if (response.kind === GeneralApiProblemKind.BadData) {
            handleBadDataResponse(response.errors, setErrors);
        } else {
            buildGeneralApiBaseHandler(response);
        }
    };

    const handleSave = async () => {
        const isValid = await save();
        if (!isValid) return;
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
                navigation.getParent()?.navigate(OverviewPath.Dashboard);
            }}
            handleSave={handleSave}
        />
    );
};
