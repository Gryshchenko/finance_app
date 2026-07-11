import { FC, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ICategory, SpendIcon, Utils } from '@tenpercent/shared';

import { CategoryFields } from '@/components/category/CategoryFields';
import { useCurrency } from '@/context/CurrencyContext';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { buildCategoryCreateSchema } from '@/schems/validationSchemas';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { CategoryService } from '@/services/CategoryService';
import { InvalidationGroups } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

export const CategoryCreate: FC = function CategoryCreate(_props) {
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { currencies } = useCurrency();
    const categoryCreateSchema = useMemo(() => buildCategoryCreateSchema(Array.from(currencies.keys())), [currencies]);
    const { form, handleChange, save, errors, setErrors, withFetching, isFetching } = useEditView<Partial<ICategory>>(
        {
            categoryName: '',
            currencyCode: 'USD',
            iconId: SpendIcon.ShoppingBag,
        },
        categoryCreateSchema,
    );

    const handleCreate = async () => {
        await withFetching(async () => {
            const categoryService = CategoryService.instance();
            if (Utils.isEmpty(form.categoryName) || Utils.isNull(form.currencyCode) || Utils.isNull(form.iconId)) {
                ToastService.error({
                    message: 'errorCode:UNKNOWN_ERROR',
                    systemMessage: `Validation error on create category, categoryName: ${form.categoryName}, currencyCode: ${form.currencyCode}, iconId: ${form.iconId}`,
                });
                return;
            }

            const response = await categoryService.doCreateCategory({
                categoryName: form.categoryName!,
                currencyCode: form.currencyCode!,
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
        });
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
            isSaveDisabled={isFetching}
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
