import { ComponentType } from 'react';
import { IIncomeStats, IStatsResponse, StatsPeriod, Time } from '@tenpercent/shared';

import { boxDataItemAdapter } from '@/components/dashboard/Box/boxDataItemAdapter';
import { DashboardBlockSkeleton } from '@/components/dashboard/DashboardBlockSkeleton';
import DashboardIncome from '@/components/dashboard/DashboardIncome';
import DashboardItem, { IDashboardItem } from '@/components/dashboard/DashboardItem';
import { useAppQuery } from '@/hooks/useAppQuery';
import { IBoxDataItem } from '@/interfaces/IBoxDataItem';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { IncomeService } from '@/services/IncomeService';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { BoxDataItemType } from '@/types/BoxDataItemType';
import { Logger } from '@/utils/logger/Logger';

export async function fetchIncomes(): Promise<IStatsResponse<IIncomeStats>> {
    try {
        const incomeService = IncomeService.instance();
        const from = Time.toMonthStart(Time.getISODateNowUTC());
        const to = Time.getISODateNowUTC();
        if (!from || !to) {
            throw new Error(`Invalid date range for fetching income stats: from ${from}, to ${to}`);
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
                return { from, to, items: [], total: 0 };
            }
        }
    } catch (e) {
        Logger.Of('FetchIncomes').error(`Fetch income failed due reason: ${(e as { message: string }).message}`);
        return { from: '', to: '', items: [], total: 0 };
    }
}

export default function DashboardIncomesItem() {
    const incomes = useAppQuery<IStatsResponse<IIncomeStats>>(QueryKeys.incomesStats(), fetchIncomes, {
        staleTime: QueryStaleTimes.dashboard,
    });

    if (incomes.isPending) {
        return <DashboardBlockSkeleton />;
    }

    return (
        <DashboardItem
            id={'incomes'}
            isExpanded={true}
            acceptedDragTypes={[]}
            keyGetter={(item: IBoxDataItem<unknown>): string => {
                if (item.type === BoxDataItemType.Default) {
                    return String((item.data as IIncomeStats)?.incomeId);
                }
                return 'new-incomes';
            }}
            Item={DashboardIncome as ComponentType<IDashboardItem<unknown>>}
            items={boxDataItemAdapter<IIncomeStats>(incomes.data?.items ?? [])}
        />
    );
}
