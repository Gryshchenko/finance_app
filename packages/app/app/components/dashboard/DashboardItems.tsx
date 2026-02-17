import { ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { DropProvider } from 'react-native-reanimated-dnd';
import { IAccountListItem, ICategory, IIncome } from 'tenpercent/shared';

import { useDragOverlay } from '@/components/Box/DragOverlayContext';
import DashboardAccount from '@/components/dashboard/DashboardAccount';
import DashboardCategory from '@/components/dashboard/DashboardCategory';
import DashboardDraggableItem from '@/components/dashboard/DashboardDraggableItem';
import DashboardIncome from '@/components/dashboard/DashboardIncome';
import DashboardItem from '@/components/dashboard/DashboardItem';
import { useAppQuery } from '@/hooks/useAppQuery';
import { fetchAccounts } from '@/screens/AccountScreens/AccountsScreen';
import { fetchCategories } from '@/screens/CategoryScreens/CategoriesScreen';
import { fetchIncomes } from '@/screens/IncomeScreens/IncomesScreen';
// import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';
import { ThemedStyle } from '@/theme/types';

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
                    keyGetter={(item: unknown) => {
                        console.log(333, String((item as IIncome).incomeId));
                        return String((item as IIncome).incomeId);
                    }}
                    Item={DashboardIncome}
                    items={incomes.data ?? []}
                />
                <DashboardItem
                    keyGetter={(item: unknown) => {
                        console.log(444, String((item as IAccountListItem).accountId));
                        return String((item as IAccountListItem).accountId);
                    }}
                    Item={DashboardAccount}
                    items={accounts.data ?? []}
                />
                <DashboardItem
                    keyGetter={(item: unknown) => String((item as ICategory).categoryId)}
                    Item={DashboardCategory}
                    items={categories.data ?? []}
                />
            </Animated.ScrollView>
        </DropProvider>
    );
}

export const $gridView: ThemedStyle<ViewStyle> = () => ({
    marginTop: 10,
});
