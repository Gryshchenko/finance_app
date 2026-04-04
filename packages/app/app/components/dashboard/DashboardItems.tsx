import { ComponentType } from 'react';
import Animated from 'react-native-reanimated';
import { DropProvider } from 'react-native-reanimated-dnd';
import { IAccountListItem, ICategoryStats, IIncomeStats, IStatsResponse, StatsPeriod, Time } from 'tenpercent/shared';

import { boxDataItemAdapter } from '@/components/dashboard/Box/boxDataItemAdapter';
import { useDragOverlay } from '@/components/dashboard/Box/DragOverlayContext';
import DashboardAccount from '@/components/dashboard/DashboardAccount';
import DashboardCategory from '@/components/dashboard/DashboardCategory';
import DashboardDraggableItem from '@/components/dashboard/DashboardDraggableItem';
import DashboardIncome from '@/components/dashboard/DashboardIncome';
import DashboardItem, { IDashboardItem } from '@/components/dashboard/DashboardItem';
import { useAppQuery } from '@/hooks/useAppQuery';
import { IBoxDataItem } from '@/interfaces/IBoxDataItem';
import { fetchAccounts } from '@/screens/AccountScreens/AccountsScreen';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { CategoryService } from '@/services/CategoryService';
import { IncomeService } from '@/services/IncomeService';
import { spacing } from '@/theme/spacing';
import { BoxDataItemType } from '@/types/BoxDataItemType';
import { Logger } from '@/utils/logger/Logger';

export async function fetchIncomes(): Promise<IStatsResponse<IIncomeStats>> {
    try {
        const incomeService = IncomeService.instance();
        const from = Time.toMonthStart(Time.getISODateNowUTC());
        const to = Time.getISODateNowUTC();
        if (!from || !to) {
            throw new Error(`Invalid date range for fetching income stats: from ${from}, to ${to}`); // This should never happen, but we want to be safe
        }
        const response = await incomeService.doGetIncomeWithStats({
            from,
            to,
            period: StatsPeriod.Month,
        });
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as IStatsResponse<IIncomeStats>;
            }
            default: {
                return {
                    from,
                    to,
                    items: [],
                    total: 0,
                };
            }
        }
    } catch (e) {
        Logger.Of('FetchIncomes').error(`Fetch income failed due reason: ${(e as { message: string }).message}`);
        return {
            from: '',
            to: '',
            items: [],
            total: 0,
        };
    }
}

export async function fetchCategories(): Promise<IStatsResponse<ICategoryStats>> {
    try {
        const from = Time.toMonthStart(Time.getISODateNowUTC());
        const to = Time.getISODateNowUTC();
        if (!from || !to) {
            throw new Error(`Invalid date range for fetching income stats: from ${from}, to ${to}`); // This should never happen, but we want to be safe
        }
        const categoriesService = CategoryService.instance();
        const response = await categoriesService.doGetCategoriesWithStats({
            from,
            to,
            period: StatsPeriod.Month,
        });
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as IStatsResponse<ICategoryStats>;
            }
            default: {
                return {
                    from: '',
                    to: '',
                    items: [],
                    total: 0,
                };
            }
        }
    } catch (e) {
        Logger.Of('FetchCategories').error(`Fetch categories failed due reason: ${(e as { message: string }).message}`);
        return {
            from: '',
            to: '',
            items: [],
            total: 0,
        };
    }
}

export default function DashboardItems() {
    const { scrollHandler, scrollRef, onOverlayLayout, dragSessionId } = useDragOverlay();
    const incomes = useAppQuery<IStatsResponse<IIncomeStats>>('incomesStats', fetchIncomes);
    const accounts = useAppQuery<IAccountListItem[]>('accounts', fetchAccounts);
    const categories = useAppQuery<IStatsResponse<ICategoryStats>>(['categoriesStats'], fetchCategories);
    return (
        <DropProvider key={dragSessionId}>
            <DashboardDraggableItem />
            <Animated.ScrollView
                ref={scrollRef}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                onLayout={(e) => {
                    onOverlayLayout(e.nativeEvent.layout);
                }}
                contentContainerStyle={{ gap: spacing.md, marginTop: spacing.lg }}
            >
                <DashboardItem
                    id={'incomes'}
                    isExpanded={true}
                    keyGetter={(item: IBoxDataItem<unknown>): string => {
                        if (item.type === BoxDataItemType.Default) {
                            return String((item.data as IIncomeStats)?.incomeId);
                        }
                        return 'new';
                    }}
                    Item={DashboardIncome as ComponentType<IDashboardItem<unknown>>}
                    items={boxDataItemAdapter<IIncomeStats>(incomes.data?.items ?? [])}
                />
                <DashboardItem
                    id={'accounts'}
                    isExpanded={true}
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
                    id={'categories'}
                    keyGetter={(item: IBoxDataItem<unknown>): string => {
                        if (item.type === BoxDataItemType.Default) {
                            return String((item.data as ICategoryStats)?.categoryId);
                        }
                        return 'new';
                    }}
                    Item={DashboardCategory as ComponentType<IDashboardItem<unknown>>}
                    items={boxDataItemAdapter<ICategoryStats>(categories.data?.items ?? [])}
                />
            </Animated.ScrollView>
        </DropProvider>
    );
}
