import { FC } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ICategory } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';

import { CategoryFields } from '@/components/category/CategoryFields';
import { useEditView } from '@/hooks/useEditView';
import { translate } from '@/i18n/translate';
import { categoryCreateSchema } from '@/schems/validationSchemas';
import AlertService from '@/services/AlertService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { CategoryService } from '@/services/CategoryService';

export const CategoryCreate: FC = function CategoryCreate(_props) {
    const navigation = useNavigation();
    const { form, handleChange, save, errors } = useEditView<Partial<ICategory>>(
        {
            categoryName: '',
            currencyId: 1,
        },
        categoryCreateSchema,
    );

    const handleCreate = async () => {
        const categoryService = CategoryService.instance();
        if (Utils.isEmpty(form.categoryName)) return;
        if (Utils.isNull(form.currencyId)) return;

        const response = await categoryService.doCreateCategory({
            categoryName: form.categoryName!,
            currencyId: form.currencyId!,
        });
        if (response.kind === GeneralApiProblemKind.Ok) {
            AlertService.info(translate('common:info'), translate('categoryScreen:createCategorySuccess'));
            navigation.getParent()?.navigate('expenses', {
                screen: 'categories',
            });
        } else {
            AlertService.error(translate('common:error'), translate('categoryScreen:createCategoryFailed'));
        }
    };

    const handleSave = async () => {
        await save();
        await handleCreate();
    };

    return (
        <CategoryFields
            form={form}
            errors={errors}
            isEdit={true}
            isView={false}
            handleChange={(key: string, value: string | number) => {
                handleChange(key as keyof ICategory, value);
            }}
            cancel={() => {
                navigation.getParent()?.navigate('expenses', {
                    screen: 'view',
                    params: { id: form.categoryId, name: form.categoryName },
                });
            }}
            handleSave={handleSave}
        />
    );
};
