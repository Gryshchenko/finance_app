import { ComponentType } from 'react';
import { ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { DropProvider } from 'react-native-reanimated-dnd';
import { IAccountListItem, ICategory, IIncome } from 'tenpercent/shared';

import { boxDataItemAdapter } from '@/components/Box/boxDataItemAdapter';
import { useDragOverlay } from '@/components/Box/DragOverlayContext';
import DashboardAccount from '@/components/dashboard/DashboardAccount';
import DashboardCategory from '@/components/dashboard/DashboardCategory';
import DashboardDraggableItem from '@/components/dashboard/DashboardDraggableItem';
import DashboardIncome from '@/components/dashboard/DashboardIncome';
import DashboardItem, { IDashboardItem } from '@/components/dashboard/DashboardItem';
import { useAppQuery } from '@/hooks/useAppQuery';
import { IBoxDataItem } from '@/interfaces/IBoxDataItem';
import { fetchAccounts } from '@/screens/AccountScreens/AccountsScreen';
import { fetchCategories } from '@/screens/CategoryScreens/CategoriesScreen';
import { fetchIncomes } from '@/screens/IncomeScreens/IncomesScreen';
import { spacing } from '@/theme/spacing';
import { ThemedStyle } from '@/theme/types';
import { BoxDataItemType } from '@/types/BoxDataItemType';

export default function DashboardItems() {
    const { scrollHandler, scrollRef, onLayout, uuid } = useDragOverlay();
    const incomes = useAppQuery<IIncome[] | undefined>('incomes', fetchIncomes);
    const accounts = useAppQuery<IAccountListItem[] | undefined>('accounts', fetchAccounts);
    const categories = useAppQuery<ICategory[] | undefined>(['categories'], async () => fetchCategories());
    return (
        <DropProvider key={uuid}>
            <Animated.ScrollView
                ref={scrollRef}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                onLayout={(e) => {
                    onLayout(e.nativeEvent.layout);
                }}
                contentContainerStyle={{ gap: spacing.md, marginTop: spacing.lg }}
            >
                <DashboardDraggableItem />
                <DashboardItem
                    keyGetter={(item: IBoxDataItem<unknown>): string => {
                        if (item.type === BoxDataItemType.Default) {
                            return String((item.data as IIncome)?.incomeId);
                        }
                        return 'new';
                    }}
                    Item={DashboardIncome as ComponentType<IDashboardItem<unknown>>}
                    items={boxDataItemAdapter<IIncome>(incomes.data ?? [])}
                />
                <DashboardItem
                    keyGetter={(item: IBoxDataItem<unknown>): string => {
                        if (item.type === BoxDataItemType.Default) {
                            return String((item.data as IAccountListItem)?.accountId);
                        }
                        return 'new';
                    }}
                    Item={DashboardAccount as ComponentType<IDashboardItem<unknown>>}
                    items={boxDataItemAdapter<IAccountListItem>(accounts.data ?? [])}
                />
                <DashboardItem
                    keyGetter={(item: IBoxDataItem<unknown>): string => {
                        if (item.type === BoxDataItemType.Default) {
                            return String((item.data as ICategory)?.categoryId);
                        }
                        return 'new';
                    }}
                    Item={DashboardCategory as ComponentType<IDashboardItem<unknown>>}
                    items={boxDataItemAdapter<ICategory>(categories.data ?? [])}
                />
            </Animated.ScrollView>
        </DropProvider>
    );
}

export const $gridView: ThemedStyle<ViewStyle> = () => ({
    marginTop: 10,
});
