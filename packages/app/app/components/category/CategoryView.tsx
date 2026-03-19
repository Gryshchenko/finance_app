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
import { CategoriesPath } from '@/navigators/CategoriesStackNavigator';
import AlertService from '@/services/AlertService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { CategoryService } from '@/services/CategoryService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

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
            ToastService.info({
                title: 'common:info',
                message: 'categoryScreen:deleteCategorySuccess',
            });
            await invalidateQuery([['categories']]);
            await invalidateQuery([['category', form.categoryId]]);
            navigation.getParent()?.navigate(OverviewPath.Dashboard);
        } else {
            ToastService.error({
                title: 'common:error',
                message: 'categoryScreen:deleteCategoryFailed',
            });
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
            isCreate={false}
            isEdit={false}
            form={form}
            isView={true}
            edit={() => {
                navigation.getParent()?.navigate(OverviewPath.Expenses, {
                    screen: CategoriesPath.CategoryEdit,
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
