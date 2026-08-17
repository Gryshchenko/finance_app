import { FC, useMemo, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, TextStyle, View, ViewStyle } from 'react-native';
import {
    CategoryIconType,
    DateFormat,
    DateTime,
    IBalance,
    ICategoryStats,
    IConnectedMember,
    IStatsResponse,
    ISummary,
    StatsScope,
    Time,
} from '@tenpercent/shared';

import { fetchBalance, fetchStats } from '@/components/BalanceSummary';
import { fetchCategories } from '@/components/dashboard/DashboardCategoriesItem';
import { EmptyState } from '@/components/EmptyState';
import { DeltaKind, InsightsCategoryRow } from '@/components/insights/InsightsCategoryRow';
import { InsightsHero } from '@/components/insights/InsightsHero';
import { IMonthOption, MonthPicker } from '@/components/insights/MonthPicker';
import { InsightsScope, ScopeToggle } from '@/components/insights/ScopeToggle';
import { PendingState } from '@/components/PengingState';
import { Text } from '@/components/Text';
import { useCurrency } from '@/context/CurrencyContext';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { fetchMonthCategoriesStats, fetchMonthSummary } from '@/screens/InsightsScreens/insightsQueries';
import { fetchConnections } from '@/screens/SharingScreens/sharingQueries';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';
import { $styles } from '@/theme/styles';
import { ThemedStyle } from '@/theme/types';
import { CurrencyUtils } from '@/utils/CurrencyUtils';

/** Percent change of `current` vs `previous`; null when there is nothing to compare against. */
function percentChange(current: number, previous: number): number | null {
    if (previous === 0) {
        return current === 0 ? 0 : null;
    }
    return ((current - previous) / Math.abs(previous)) * 100;
}

function formatPercent(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/** Splits a money value the way the hero draws it: whole part large, cents small. */
function splitMoney(value: number, currency: string): [string, string] {
    const [whole, cents] = Math.abs(value).toFixed(2).split('.');
    const sign = value < 0 ? '-' : '';
    return [`${sign}${CurrencyUtils.formatWithDelimiter(whole, currency, 0, false)}`, `.${cents}`];
}

interface IProps {
    onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    /** Height of the pinned blur header - the content starts exactly below it. */
    contentPaddingTop?: number;
    /** Height of the pinned blur footer - the last row can scroll clear of it. */
    contentPaddingBottom?: number;
}

export const BalanceInsights: FC<IProps> = ({ onScroll, contentPaddingTop, contentPaddingBottom }) => {
    const { themed } = useAppTheme();
    const { defaultCurrency, getCurrencySymbol } = useCurrency();

    const [scope, setScope] = useState<InsightsScope>(StatsScope.Own);

    const nowISO = Time.getISODateNowUTC();
    // Comparison target: any past month, previous one by default.
    const monthOptions = useMemo<IMonthOption[]>(
        () =>
            Array.from({ length: 12 }, (_, i) => {
                const monthStart = DateTime.utc()
                    .startOf('month')
                    .minus({ months: i + 1 })
                    .toISO() as string;
                return { monthStart, label: Time.formatUTCDate(monthStart, DateFormat.MONTH_YEAR) };
            }),
        [],
    );
    const [compareMonth, setCompareMonth] = useState<string>(monthOptions[0].monthStart);
    const compareMonthLabel = Time.formatUTCDate(compareMonth, DateFormat.MONTH_YEAR);
    const currentMonthLabel = Time.formatUTCDate(nowISO, DateFormat.MONTH_YEAR);

    // Drives whether the Mine / Shared switch is offered at all. Gated on accepted
    // connections rather than on groups: a group nobody joined shares nothing, and
    // "Shared" spans every group anyway - the screen never names one.
    const { data: connections } = useAppQuery<IConnectedMember[] | undefined>(QueryKeys.sharingConnections(), fetchConnections, {
        staleTime: QueryStaleTimes.list,
    });

    const memberCount = connections?.length ?? 0;
    // Fall back to `own` if the connections disappear while the shared tab is open.
    const activeScope = scope === StatsScope.Shared && memberCount > 0 ? StatsScope.Shared : StatsScope.Own;

    const { data: summary, isPending: summaryPending } = useAppQuery<ISummary | null>(
        QueryKeys.stats(activeScope),
        () => fetchStats(activeScope),
        { staleTime: QueryStaleTimes.dashboard },
    );
    const { data: balance, isPending: balancePending } = useAppQuery<IBalance | null>(
        QueryKeys.balance(activeScope),
        () => fetchBalance(activeScope),
        { staleTime: QueryStaleTimes.dashboard },
    );
    const { data: categories, isPending: categoriesPending } = useAppQuery<IStatsResponse<ICategoryStats>>(
        QueryKeys.categoriesStats(activeScope),
        () => fetchCategories(activeScope),
        { staleTime: QueryStaleTimes.dashboard },
    );
    const { data: compareSummary, isPending: compareSummaryPending } = useAppQuery<ISummary | null>(
        QueryKeys.monthSummary(compareMonth, activeScope),
        () => fetchMonthSummary(compareMonth, activeScope),
        { staleTime: QueryStaleTimes.detail },
    );
    const { data: compareCategories, isPending: comparePending } = useAppQuery<IStatsResponse<ICategoryStats>>(
        QueryKeys.monthCategoriesStats(compareMonth, activeScope),
        () => fetchMonthCategoriesStats(compareMonth, activeScope),
        { staleTime: QueryStaleTimes.detail },
    );

    const isShared = activeScope === StatsScope.Shared;
    // Switching scope refetches, so this is true again on every toggle - the spinner
    // replaces the content only, never the toggle the user just tapped.
    const contentPending = summaryPending || balancePending || categoriesPending;

    const income = summary?.income_total ?? 0;
    const expenses = summary?.expense_total ?? 0;
    const totalBalance = Number(balance?.balance ?? 0);

    // Balance growth = net flow (income - expenses) of the month, compared between
    // the current month and the selected one.
    const netCurrent = income - expenses;
    const netCompare = (compareSummary?.income_total ?? 0) - (compareSummary?.expense_total ?? 0);
    const trendPercent = compareSummaryPending ? undefined : percentChange(netCurrent, netCompare);
    const trendUp = trendPercent != null ? trendPercent >= 0 : netCurrent >= 0;
    const trendText = trendPercent === undefined ? '…' : trendPercent === null ? '—' : formatPercent(trendPercent);

    // How much of what came in this month has already gone out. With no income the
    // bar reads as fully spent as soon as there is any spending at all.
    const spentRatio = income > 0 ? Math.min(expenses / income, 1) : expenses > 0 ? 1 : 0;
    const spentPercent = Math.round(spentRatio * 100);

    const scopeName = translate(isShared ? 'insights:sharedAccounts' : 'insights:allAccounts');
    const heroKicker = `${currentMonthLabel} · ${scopeName}`;

    const compareAmounts = new Map<number, number>(
        (compareCategories?.items ?? []).map((item) => [item.categoryId, item.amount ?? 0]),
    );
    // Sorted by spend: the share bars only read as a ranking if the list is ordered.
    const categoryItems = [...(categories?.items ?? [])].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
    const maxAmount = categoryItems.reduce((max, item) => Math.max(max, item.amount ?? 0), 0);

    return (
        <ScrollView
            style={$styles.flex1}
            contentContainerStyle={{
                paddingTop: (contentPaddingTop ?? 0) + spacing.md,
                paddingBottom: (contentPaddingBottom ?? 0) + spacing.xxl,
            }}
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
        >
            {/* Only offered when there is somebody to share with. */}
            {memberCount > 0 && (
                <View style={$scopeToggleWrapper}>
                    <ScopeToggle scope={scope} onChange={setScope} memberCount={memberCount} />
                </View>
            )}

            {contentPending ? (
                <View style={$pendingBlock}>
                    <PendingState />
                </View>
            ) : (
                <>
                    <InsightsHero
                        kicker={heroKicker}
                        balance={splitMoney(totalBalance, defaultCurrency)}
                        income={CurrencyUtils.formatWithDelimiter(income, defaultCurrency, 2, true)}
                        spent={CurrencyUtils.formatWithDelimiter(expenses, defaultCurrency, 2, true)}
                        trend={trendText}
                        trendUp={trendUp}
                        trendNote={translate('insights:netFlowVs', { month: compareMonthLabel })}
                        spentRatio={spentRatio}
                        spentLabel={translate('insights:percentSpent', { percent: spentPercent })}
                    />

                    {/* Categories for the current month with dynamics vs the selected month */}
                    <View style={themed($sectionHeader)}>
                        <Text tx={'insights:categories'} style={themed($sectionTitle)} />
                        <MonthPicker options={monthOptions} selected={compareMonth} onSelect={setCompareMonth} />
                    </View>

                    {categoryItems.length === 0 ? (
                        <EmptyState headingTx={'insights:categories'} contentTx={'insights:categoriesEmpty'} />
                    ) : (
                        categoryItems.map((item, index) => {
                            const amount = item.amount ?? 0;
                            const delta = percentChange(amount, compareAmounts.get(item.categoryId) ?? 0);
                            const deltaKind: DeltaKind = comparePending
                                ? 'flat'
                                : delta === null
                                  ? 'new'
                                  : delta > 0
                                    ? 'up'
                                    : delta < 0
                                      ? 'down'
                                      : 'flat';

                            return (
                                <InsightsCategoryRow
                                    key={item.categoryId}
                                    name={item.categoryName}
                                    icon={item.iconId as CategoryIconType}
                                    amount={CurrencyUtils.formatWithDelimiter(
                                        amount,
                                        getCurrencySymbol(item.currencyCode),
                                        2,
                                        true,
                                    )}
                                    // Share of the biggest category, so the top row fills the bar.
                                    share={maxAmount > 0 ? amount / maxAmount : 0}
                                    delta={
                                        comparePending
                                            ? '…'
                                            : delta === null
                                              ? translate('insights:newSpending').toUpperCase()
                                              : formatPercent(delta)
                                    }
                                    deltaKind={deltaKind}
                                    isLast={index === categoryItems.length - 1}
                                />
                            );
                        })
                    )}
                </>
            )}
        </ScrollView>
    );
};

const $pendingBlock: ViewStyle = {
    minHeight: 280,
};

const $scopeToggleWrapper: ViewStyle = {
    marginBottom: spacing.sm,
};

const $sectionHeader: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
});

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: colors.textDim,
    fontFamily: typography.primary.medium,
});
