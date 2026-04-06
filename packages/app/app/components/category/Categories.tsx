import { FC } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ICategory } from 'tenpercent/shared';

import CategorySectionList from '@/components/category/CategoriesSectionList';
import { EmptyState } from '@/components/EmptyState';
import { OverviewPath } from '@/types/OverviewPath';

interface ICategoriesPros {
    data: ICategory[] | undefined;
    onPress?: (id: number, name: string) => void;
}

export const Categories: FC<ICategoriesPros> = function Categories(_props) {
    const { data, onPress } = _props;
    const navigation = useNavigation();

    if (!data || data?.length <= 0) {
        return (
            <EmptyState
                style={$styles.containerStyleOverride}
                buttonOnPress={() => navigation.getParent()?.navigate(OverviewPath.Dashboard)}
            />
        );
    }

    return <CategorySectionList categories={data} onPress={onPress} />;
};

const $styles = StyleSheet.create({
    containerStyleOverride: {
        margin: 'auto',
    },
});
