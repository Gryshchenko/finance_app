import { useState } from 'react';
import { ScrollView, View, ViewStyle } from 'react-native';
import { PortalProvider } from '@gorhom/portal';
import { DropProvider } from 'react-native-reanimated-dnd';
import { IAccountListItem, ICategory, IIncome } from 'tenpercent/shared';

import { AccountBox } from '@/components/Box/AccountBox';
import { CategoryBox } from '@/components/Box/CategoryBox';
import { IncomeBox } from '@/components/Box/IncomeBox';
import { ItemType } from '@/components/Box/ItemBox';
import { useCurrency } from '@/context/CurrencyContext';
import { useAppQuery } from '@/hooks/useAppQuery';
import { fetchAccounts } from '@/screens/AccountScreens/AccountsScreen';
import { fetchCategories } from '@/screens/CategoryScreens/CategoriesScreen';
import { fetchIncomes } from '@/screens/IncomeScreens/IncomesScreen';
import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';
import { ThemedStyle } from '@/theme/types';
import { buildMatrix } from '@/utils/buildMatrix';
import { CurrencyUtils } from '@/utils/CurrencyUtils';

export default function DashboardItems() {
    const { themed } = useAppTheme();
    const { getCurrencySymbol } = useCurrency();

    const incomes = useAppQuery<IIncome[] | undefined>('incomes', fetchIncomes);
    const accounts = useAppQuery<IAccountListItem[] | undefined>('accounts', fetchAccounts);
    const categories = useAppQuery<ICategory[] | undefined>(['categories'], async () => fetchCategories());
    const [containerWidth, setContainerWidth] = useState(0);

    const [draggingType, setDraggingType] = useState<ItemType | null>(null);
    const incomeMatix = buildMatrix<IIncome>({
        containerWidth,
        itemWidth: 80,
        gap: 0,
        padding: 0,
        items: (incomes.data as IIncome[]) ?? [],
    });
    const accountMatrix = buildMatrix<IAccountListItem>({
        containerWidth,
        itemWidth: 80,
        gap: 0,
        padding: 0,
        items: (accounts.data as IAccountListItem[]) ?? [],
    });
    const categoriesMatrix = buildMatrix<ICategory>({
        containerWidth,
        itemWidth: 80,
        gap: 0,
        padding: 0,
        items: (categories.data as ICategory[]) ?? [],
    });
    return (
        <DropProvider>
            <ScrollView contentContainerStyle={{ gap: spacing.md, marginTop: spacing.lg }}>
                <View onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
                    {incomeMatix.matrix.map((row, y) => (
                        <View key={y} style={{ flexDirection: 'row', marginBottom: 10 }}>
                            {row.map((item, index) => {
                                return (
                                    <IncomeBox
                                        BoxProps={{
                                            styles: {
                                                container: {
                                                    alignItems: 'center',
                                                    marginRight: index !== row.length - 1 ? incomeMatix.payload.calculatedGap : 0,
                                                },
                                            },
                                        }}
                                        id={String(item.incomeId)}
                                        key={item.incomeName}
                                        title={item.incomeName}
                                        icon={'tmp'}
                                        value={CurrencyUtils.formatWithDelimiter(231, getCurrencySymbol(item.currencyId))}
                                        isDraggable={true}
                                        onDragStart={(item) => {
                                            setDraggingType(ItemType.Income);
                                            console.log('incomes onDragStart', item);
                                        }}
                                        onDragEnd={() => {
                                            console.log('incomes onDragEnd');
                                            setDraggingType(null);
                                        }}
                                    />
                                );
                            })}
                        </View>
                    ))}
                </View>
                <View onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
                    {accountMatrix.matrix.map((row, y) => (
                        <View key={y} style={{ flexDirection: 'row', marginBottom: 10 }}>
                            {row.map((item, index) => {
                                return (
                                    <AccountBox
                                        BoxProps={{
                                            styles: {
                                                container: {
                                                    alignItems: 'center',
                                                    marginRight: index !== row.length - 1 ? incomeMatix.payload.calculatedGap : 0,
                                                },
                                            },
                                        }}
                                        id={String(item.accountId)}
                                        key={item.accountName}
                                        title={item.accountName}
                                        icon={'tmp'}
                                        value={CurrencyUtils.formatWithDelimiter(item.amount, getCurrencySymbol(item.currencyId))}
                                        isDraggable={true}
                                        onDrop={(item) => {
                                            console.log('drop', item);
                                        }}
                                        onDragStart={(item) => {
                                            setDraggingType(ItemType.Account);
                                            console.log('account onDragStart', item);
                                        }}
                                        onDragEnd={() => {
                                            console.log('account onDragEnd');
                                            setDraggingType(null);
                                        }}
                                        isDroppable={[ItemType.Account, ItemType.Income].includes(draggingType as ItemType)}
                                    />
                                );
                            })}
                        </View>
                    ))}
                </View>
                <View onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
                    {categoriesMatrix.matrix.map((row, y) => (
                        <View key={y} style={{ flexDirection: 'row', marginBottom: 10 }}>
                            {row.map((item, index) => {
                                return (
                                    <CategoryBox
                                        BoxProps={{
                                            styles: {
                                                container: {
                                                    alignItems: 'center',
                                                    marginRight: index !== row.length - 1 ? incomeMatix.payload.calculatedGap : 0,
                                                },
                                            },
                                        }}
                                        id={String(item.categoryId)}
                                        title={item.categoryName}
                                        icon={'tmp'}
                                        value={CurrencyUtils.formatWithDelimiter(2321, getCurrencySymbol(item.currencyId))}
                                        isDroppable={draggingType === ItemType.Account}
                                        onDrop={(item) => {
                                            console.log('drop', item);
                                        }}
                                    />
                                );
                            })}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </DropProvider>
    );
}

export const $gridView: ThemedStyle<ViewStyle> = () => ({
    marginTop: 10,
});
