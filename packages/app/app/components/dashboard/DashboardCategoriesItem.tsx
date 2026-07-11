import { ComponentType } from 'react';
import { ICategoryStats, IStatsResponse, StatsPeriod, Time } from '@tenpercent/shared';

import { boxDataItemAdapter } from '@/components/dashboard/Box/boxDataItemAdapter';
import { ItemType } from '@/components/dashboard/Box/ItemBox';
import { DashboardBlockSkeleton } from '@/components/dashboard/DashboardBlockSkeleton';
import DashboardCategory from '@/components/dashboard/DashboardCategory';
import DashboardItem, { IDashboardItem } from '@/components/dashboard/DashboardItem';
import { useAppQuery } from '@/hooks/useAppQuery';
import { IBoxDataItem } from '@/interfaces/IBoxDataItem';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { CategoryService } from '@/services/CategoryService';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { BoxDataItemType } from '@/types/BoxDataItemType';
import { Logger } from '@/utils/logger/Logger';

export async function fetchCategories(): Promise<IStatsResponse<ICategoryStats>> {
    try {
        const from = Time.toMonthStart(Time.getISODateNowUTC());
        const to = Time.getISODateNowUTC();
        if (!from || !to) {
            throw new Error(`Invalid date range for fetching income stats: from ${from}, to ${to}`);
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
                return { from: '', to: '', items: [], total: 0 };
            }
        }
    } catch (e) {
        Logger.Of('FetchCategories').error(`Fetch categories failed due reason: ${(e as { message: string }).message}`);
        return { from: '', to: '', items: [], total: 0 };
    }
}

export default function DashboardCategoriesItem() {
    const categories = useAppQuery<IStatsResponse<ICategoryStats>>(QueryKeys.categoriesStats(), fetchCategories, {
        staleTime: QueryStaleTimes.dashboard,
    });

    if (categories.isPending) {
        return <DashboardBlockSkeleton />;
    }

    return (
        <DashboardItem
            id={'categories'}
            acceptedDragTypes={[ItemType.Account]}
            keyGetter={(item: IBoxDataItem<unknown>): string => {
                if (item.type === BoxDataItemType.Default) {
                    return String((item.data as ICategoryStats)?.categoryId);
                }
                return 'new-categories';
            }}
            Item={DashboardCategory as ComponentType<IDashboardItem<unknown>>}
            items={boxDataItemAdapter<ICategoryStats>(categories.data?.items ?? [])}
        />
    );
}
