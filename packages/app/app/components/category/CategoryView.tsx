import { FC } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ICategory } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';

import { CategoryFields } from '@/components/category/CategoryFields';
import { EmptyState } from '@/components/EmptyState';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { translate } from '@/i18n/translate';
import AlertService from '@/services/AlertService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { CategoryService } from '@/services/CategoryService';

interface ICategoryPros {
    data: ICategory | undefined;
}

export const CategoryView: FC<ICategoryPros> = function CategoryView(_props) {
    const { data } = _props;
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { form } = useEditView<ICategory>(data!);

    const handleDelete = async () => {
        const categoryService = CategoryService.instance();
        if (!form.categoryId) return;

        const response = await categoryService.doDeleteCategory(form.categoryId);
        if (response.kind === GeneralApiProblemKind.Ok) {
            AlertService.info(translate('common:info'), translate('categoryScreen:deleteCategorySuccess'));
            await invalidateQuery([['categories']]);
            await invalidateQuery([['category', form.categoryId]]);
            navigation.getParent()?.navigate('expenses', {
                screen: 'categories',
            });
        } else {
            AlertService.error(translate('common:error'), translate('categoryScreen:deleteCategoryFailed'));
        }
    };

    const onDelete = () => {
        AlertService.confirm(
            translate('categoryScreen:deleteCategoryTitle'),
            translate('categoryScreen:deleteCategoryMessage'),
            handleDelete,
        );
    };

    if (!data) {
        return <EmptyState style={$containerStyleOverride} buttonOnPress={() => navigation.goBack()} />;
    }

    return (
        <CategoryFields
            form={form}
            isView={true}
            isEdit={false}
            edit={() => {
                navigation.getParent()?.navigate('expenses', {
                    screen: 'edit',
                    params: {
                        id: form.categoryId,
                        name: form.categoryName,
                        payload: Utils.objectToString(form),
                    },
                });
            }}
            onDelete={onDelete}
        />
    );
};
const $containerStyleOverride: StyleProp<ViewStyle> = {
    margin: 'auto',
};
