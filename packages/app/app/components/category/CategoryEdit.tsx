import { FC } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ICategory, Utils } from '@tenpercent/shared';

import { CategoryFields } from '@/components/category/CategoryFields';
import { EmptyState } from '@/components/EmptyState';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { useGoBackSmart } from '@/hooks/useGoBackSmart';
import { useHeaderRightAction } from '@/hooks/useHeaderRightAction';
import { translate } from '@/i18n/translate';
import { categoryEditSchema } from '@/schems/validationSchemas';
import AlertService from '@/services/AlertService';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { CategoryService } from '@/services/CategoryService';
import { InvalidationGroups } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import type { BackTarget } from '@/types/BackTarget';
import { OverviewPath } from '@/types/OverviewPath';
import { ensureOwner } from '@/utils/ownerGuard';

interface ICategoryPros {
    data: Partial<ICategory> | undefined;
    back?: BackTarget;
}

export const CategoryEdit: FC<ICategoryPros> = function CategoryEdit(_props) {
    const { data, back } = _props;
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, save, errors, setErrors, withFetching, isFetching } = useEditView<Partial<ICategory>>(
        data!,
        categoryEditSchema,
    );
    const goBackSmart = useGoBackSmart(back);

    const handlePatch = async () => {
        if (!ensureOwner(form.isOwner)) return;
        await withFetching(async () => {
            const categoryService = CategoryService.instance();
            if (Utils.isEmpty(form.categoryName)) return;
            if (Utils.isNull(form.categoryId)) return;

            const response = await categoryService.doPatchCategory(form.categoryId!, {
                categoryName: form.categoryName!,
                iconId: form.iconId,
                budget: form.budget ?? undefined,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.info({
                    title: 'common:info',
                    message: 'categoryScreen:updateCategorySuccess',
                });
                await invalidateQuery(InvalidationGroups.category(form.categoryId));
                goBackSmart();
            } else if (response.kind === GeneralApiProblemKind.BadData) {
                handleBadDataResponse(response.errors, setErrors);
            } else {
                buildGeneralApiBaseHandler(response);
            }
        });
    };
    const handleDelete = async (keepData: boolean) => {
        await withFetching(async () => {
            const categoryService = CategoryService.instance();
            if (!form.categoryId) return;

            const response = await categoryService.doDeleteCategory(form.categoryId, { keepData });
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.info({
                    title: 'common:info',
                    message: 'categoryScreen:deleteCategorySuccess',
                });
                await invalidateQuery(InvalidationGroups.category(form.categoryId));
                navigation.getParent()?.navigate(OverviewPath.Dashboard);
            } else {
                ToastService.error({
                    title: 'common:error',
                    message: 'categoryScreen:deleteCategoryFailed',
                });
            }
        });
    };

    const onDelete = () => {
        if (!ensureOwner(form.isOwner)) return;
        AlertService.prompt(translate('categoryScreen:deleteCategoryTitle'), translate('categoryScreen:deleteCategoryMessage'), [
            { text: translate('common:keepData'), onPress: () => handleDelete(true) },
            { text: translate('common:deleteAll'), onPress: () => handleDelete(false) },
            { text: translate('common:cancel'), style: 'cancel' },
        ]);
    };

    const handleSave = async () => {
        const isValid = await save();
        if (!isValid) return;
        await handlePatch();
    };

    useHeaderRightAction(data ? onDelete : undefined, { disabled: isFetching });

    if (!data) {
        return (
            <EmptyState
                style={$containerStyleOverride}
                buttonOnPress={() => {
                    goBackSmart();
                }}
            />
        );
    }

    return (
        <CategoryFields
            form={form}
            isCreate={false}
            isEdit={true}
            errors={errors}
            isView={false}
            isSaveDisabled={isFetching}
            isDeleteDisabled={isFetching}
            handleChange={(key: string, value: string | number) => {
                handleChange(key as keyof ICategory, value);
            }}
            handleSave={handleSave}
        />
    );
};
const $containerStyleOverride: StyleProp<ViewStyle> = {
    margin: 'auto',
};
