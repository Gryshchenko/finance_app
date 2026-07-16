import { ICategoryStats, IStatsResponse, ISummary, StatsPeriod, Time } from '@tenpercent/shared';

import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { CategoryService } from '@/services/CategoryService';
import { StatsService } from '@/services/StatsService';
import { Logger } from '@/utils/logger/Logger';

function getMonthRange(monthStartISO: string): { from: string; to: string } | null {
    const from = Time.toMonthStart(monthStartISO);
    const endExclusive = Time.toMonthEndExclusive(monthStartISO);
    if (!from || !endExclusive) {
        return null;
    }
    // The current month has no end yet - stats run up to "now".
    const now = Time.getISODateNowUTC();
    const to = endExclusive > now ? now : endExclusive;
    return { from, to };
}

export async function fetchMonthSummary(monthStartISO: string): Promise<ISummary | null> {
    try {
        const range = getMonthRange(monthStartISO);
        if (!range) {
            throw new Error(`Invalid month for summary: ${monthStartISO}`);
        }
        const response = await StatsService.instance().doGetStats({ ...range, period: StatsPeriod.Month });
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as ISummary;
            }
            default: {
                return null;
            }
        }
    } catch (e) {
        Logger.Of('FetchMonthSummary').error(`Fetch month summary failed due reason: ${(e as { message: string }).message}`);
        return null;
    }
}

export async function fetchMonthCategoriesStats(monthStartISO: string): Promise<IStatsResponse<ICategoryStats>> {
    try {
        const range = getMonthRange(monthStartISO);
        if (!range) {
            throw new Error(`Invalid month for categories stats: ${monthStartISO}`);
        }
        const response = await CategoryService.instance().doGetCategoriesWithStats({ ...range, period: StatsPeriod.Month });
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as IStatsResponse<ICategoryStats>;
            }
            default: {
                return { from: '', to: '', items: [], total: 0 };
            }
        }
    } catch (e) {
        Logger.Of('FetchMonthCategoriesStats').error(
            `Fetch month categories stats failed due reason: ${(e as { message: string }).message}`,
        );
        return { from: '', to: '', items: [], total: 0 };
    }
}
