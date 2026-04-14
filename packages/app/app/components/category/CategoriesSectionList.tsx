import { forwardRef } from 'react';
import { SectionList, StyleProp, View, ViewStyle, TextStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ICategory, Utils } from 'tenpercent/shared';

import { EmptyState } from '@/components/EmptyState';
import SectionListWithKeyboardAwareScrollView from '@/components/SectionListWithKeyboardAwareScrollView';
import { Text } from '@/components/Text';
import { ViewButton } from '@/components/ViewButton';
import { useCurrency } from '@/context/CurrencyContext';
import { CategoriesPath } from '@/navigators/CategoriesStackNavigator';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';
import { OverviewPath } from '@/types/OverviewPath';
import { CurrencyUtils } from '@/utils/CurrencyUtils';

import { ListItem } from '../ListItem';

interface Props {
    categories: ICategory[];
    onPress?: (id: number, name: string) => void;
}

const CategorySectionList = forwardRef<SectionList<ICategory>, Props>(({ categories, onPress }, ref) => {
    const navigation = useNavigation();
    const { themed } = useAppTheme();
    const { getCurrencySymbol } = useCurrency();

    if (!categories || categories?.length <= 0) {
        return <EmptyState style={themed([$containerStyleOverride])} buttonOnPress={() => navigation.goBack()} />;
    }
    const sections = [
        {
            name: '',
            description: '',
            data: categories,
        },
    ];

    const renderItem = ({ item: transaction }: { item: ICategory }) => {
        if (!transaction) return null;
        const { categoryName, currencyId, categoryId } = transaction;

        return (
            <ListItem
                key={currencyId}
                disabled={!Utils.isNumber(currencyId as unknown as string)}
                bottomSeparator
                onPress={() => {
                    if (onPress) onPress?.(categoryId, categoryName);
                }}
                RightComponent={
                    <>
                        <Text style={themed([$center])}>
                            {CurrencyUtils.formatWithDelimiter(0, getCurrencySymbol(currencyId))}
                        </Text>
                        <View style={$buttons}>
                            <ViewButton
                                style={$button}
                                onPress={() => {
                                    navigation.getParent()?.navigate(OverviewPath.Categories, {
                                        screen: CategoriesPath.CategoryEdit,
                                        params: { id: categoryId, name: categoryName },
                                    });
                                }}
                            />
                        </View>
                    </>
                }
            >
                <View style={themed([$leftContainer])}>
                    <Text style={themed([$typeLabel])}>{categoryName}</Text>
                </View>
            </ListItem>
        );
    };

    return (
        <SectionListWithKeyboardAwareScrollView
            ref={ref}
            sections={sections}
            keyExtractor={(item: ICategory) => String(item.categoryId)}
            renderItem={renderItem}
            stickySectionHeadersEnabled={true}
            renderSectionHeader={({ section }) => {
                return <Text style={themed([$header])}>{section.name}</Text>;
            }}
        />
    );
});

CategorySectionList.displayName = 'CategoriesSectionList';

export default CategorySectionList;

export const $center: ThemedStyle<ViewStyle> = () => ({
    alignContent: 'center',
    alignItems: 'center',
    display: 'flex',
    height: '100%',
});

export const $containerStyleOverride: ThemedStyle<ViewStyle> = () => ({
    margin: 'auto',
});

export const $description: ThemedStyle<TextStyle> = (theme) => ({
    fontSize: 13,
    color: theme.colors.textDim,
});

export const $flowText: ThemedStyle<TextStyle> = () => ({
    fontSize: 13,
    lineHeight: 18,
});

export const $header: ThemedStyle<ViewStyle> = ({ colors }) => ({
    backgroundColor: colors.background,
    display: 'flex',
    justifyContent: 'center',
    paddingBottom: 10,
    paddingTop: 10,
});

export const $leftContainer: ThemedStyle<ViewStyle> = () => ({
    flexDirection: 'column',
});

export const $typeLabel: ThemedStyle<TextStyle> = (theme) => ({
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    color: theme.colors.text,
});
const $buttons: StyleProp<ViewStyle> = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    height: '100%',
};
const $button: StyleProp<ViewStyle> = {
    paddingHorizontal: 5,
};
