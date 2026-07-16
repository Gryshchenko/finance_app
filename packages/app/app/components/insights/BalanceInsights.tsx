import { FC, useMemo, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, TextStyle, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
    CategoryIconType,
    DateFormat,
    DateTime,
    IBalance,
    ICategoryStats,
    IStatsResponse,
    ISummary,
    Time,
} from '@tenpercent/shared';

import { fetchBalance, fetchStats } from '@/components/BalanceSummary';
import { CategoryIcon } from '@/components/CategoryIcon';
import { fetchCategories } from '@/components/dashboard/DashboardCategoriesItem';
import { EmptyState } from '@/components/EmptyState';
import { IMonthOption, MonthPicker } from '@/components/insights/MonthPicker';
import { PendingState } from '@/components/PengingState';
import { Text } from '@/components/Text';
import { useCurrency } from '@/context/CurrencyContext';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { fetchMonthCategoriesStats, fetchMonthSummary } from '@/screens/InsightsScreens/insightsQueries';
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

interface IProps {
    onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    /** Height of the pinned blur header - the content starts exactly below it. */
    contentPaddingTop?: number;
    /** Height of the pinned blur footer - the last row can scroll clear of it. */
    contentPaddingBottom?: number;
}

export const BalanceInsights: FC<IProps> = ({ onScroll, contentPaddingTop, contentPaddingBottom }) => {
    const {
        themed,
        theme: { colors },
    } = useAppTheme();
    const { defaultCurrency, getCurrencySymbol } = useCurrency();

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
    // Compact "vs Jun" form for category rows; the year is only spelled out when the
    // comparison crosses a year boundary (e.g. "Dec '25"). The default target (the
    // previous month) reads as "vs last month".
    const compareDt = DateTime.fromISO(compareMonth, { zone: 'utc' });
    const compareShortLabel = compareDt.year === DateTime.utc().year ? compareDt.toFormat('LLL') : compareDt.toFormat("LLL ''yy");
    const rowVsLabel =
        compareMonth === monthOptions[0].monthStart
            ? translate('insights:vsLastMonth')
            : translate('insights:vsMonth', { month: compareShortLabel });

    const { data: summary, isPending: summaryPending } = useAppQuery<ISummary | null>(QueryKeys.stats(), fetchStats, {
        staleTime: QueryStaleTimes.dashboard,
    });
    const { data: balance, isPending: balancePending } = useAppQuery<IBalance | null>(QueryKeys.balance(), fetchBalance, {
        staleTime: QueryStaleTimes.dashboard,
    });
    const { data: categories, isPending: categoriesPending } = useAppQuery<IStatsResponse<ICategoryStats>>(
        QueryKeys.categoriesStats(),
        fetchCategories,
        { staleTime: QueryStaleTimes.dashboard },
    );
    const { data: compareSummary, isPending: compareSummaryPending } = useAppQuery<ISummary | null>(
        QueryKeys.monthSummary(compareMonth),
        () => fetchMonthSummary(compareMonth),
        { staleTime: QueryStaleTimes.detail },
    );
    const { data: compareCategories, isPending: compareCategoriesPending } = useAppQuery<IStatsResponse<ICategoryStats>>(
        QueryKeys.monthCategoriesStats(compareMonth),
        () => fetchMonthCategoriesStats(compareMonth),
        { staleTime: QueryStaleTimes.detail },
    );

    if (summaryPending || balancePending || categoriesPending) {
        return <PendingState />;
    }

    const income = summary?.income_total ?? 0;
    const expenses = summary?.expense_total ?? 0;
    const totalBalance = Number(balance?.balance ?? 0);

    // Balance growth = net flow (income - expenses) of the month, compared between
    // the current month and the selected one.
    const netCurrent = income - expenses;
    const netCompare = (compareSummary?.income_total ?? 0) - (compareSummary?.expense_total ?? 0);
    const trendPercent = compareSummaryPending ? undefined : percentChange(netCurrent, netCompare);
    const trendUp = netCurrent >= 0;
    const trendColor = trendUp ? colors.palette.green400 : colors.error;
    const trendLabelTx = netCurrent > 0 ? 'insights:growing' : netCurrent < 0 ? 'insights:declining' : 'insights:steady';

    const compareAmounts = new Map<number, number>(
        (compareCategories?.items ?? []).map((item) => [item.categoryId, item.amount ?? 0]),
    );
    const categoryItems = categories?.items ?? [];

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
            {/* Top metrics */}
            <View style={$metricsRow}>
                <View style={themed($metricCard)}>
                    <Text text={currentMonthLabel} style={themed($metricEyebrow)} />
                    <View>
                        <Text tx={'insights:totalIncome'} style={themed($metricLabel)} />
                        <Text
                            text={CurrencyUtils.formatWithDelimiter(income, defaultCurrency, 2, true)}
                            style={themed($metricValue)}
                        />
                    </View>
                </View>
                <View style={themed($metricCard)}>
                    <Text tx={'insights:allAccounts'} style={themed($metricEyebrow)} />
                    <View>
                        <Text tx={'insights:totalBalance'} style={themed($metricLabel)} />
                        <Text
                            text={CurrencyUtils.formatWithDelimiter(totalBalance, defaultCurrency, 2, true)}
                            style={themed($metricValue)}
                        />
                    </View>
                </View>
            </View>

            {/* Balance trend vs selected month */}
            <View style={themed($trendCard)}>
                <View style={$styles.flex1}>
                    <Text text={translate('insights:trendVs', { month: compareMonthLabel })} style={themed($metricEyebrow)} />
                    <Text tx={trendLabelTx} style={themed($trendTitle)} />
                </View>
                <View style={themed($trendBadge)}>
                    <MaterialIcons name={trendUp ? 'trending-up' : 'trending-down'} size={18} color={trendColor} />
                    <Text
                        text={trendPercent === undefined ? '…' : trendPercent === null ? '—' : formatPercent(trendPercent)}
                        style={[themed($trendValue), { color: trendColor }]}
                    />
                </View>
            </View>

            {/* Categories for the current month with dynamics vs the selected month */}
            <View style={themed($sectionHeader)}>
                <Text tx={'insights:categories'} style={themed($sectionTitle)} />
                <MonthPicker options={monthOptions} selected={compareMonth} onSelect={setCompareMonth} />
            </View>

            {categoryItems.length === 0 ? (
                <EmptyState headingTx={'insights:categories'} contentTx={'insights:categoriesEmpty'} />
            ) : (
                <View style={themed($card)}>
                    {categoryItems.map((item, index) => (
                        <CategoryRow
                            vsLabel={rowVsLabel}
                            key={item.categoryId}
                            item={item}
                            compareAmount={compareAmounts.get(item.categoryId) ?? 0}
                            comparePending={compareCategoriesPending}
                            isLast={index === categoryItems.length - 1}
                            currencySymbol={getCurrencySymbol(item.currencyCode)}
                        />
                    ))}
                </View>
            )}
        </ScrollView>
    );
};

const CategoryRow: FC<{
    item: ICategoryStats;
    compareAmount: number;
    comparePending: boolean;
    isLast: boolean;
    currencySymbol: string | undefined;
    vsLabel: string;
}> = ({ item, compareAmount, comparePending, isLast, currencySymbol, vsLabel }) => {
    const {
        themed,
        theme: { colors },
    } = useAppTheme();

    const amount = item.amount ?? 0;
    const delta = percentChange(amount, compareAmount);
    // These are expenses: spending more than in the comparison month is bad news.
    const deltaColor = delta === null || delta === 0 ? colors.textDim : delta > 0 ? colors.error : colors.palette.green400;

    return (
        <View style={[themed($row), !isLast && themed($rowBorder)]}>
            <View style={$rowLeft}>
                <CategoryIcon name={item.iconId as CategoryIconType} size={22} color={colors.textDim} />
                <Text text={item.categoryName} style={themed($rowTitle)} numberOfLines={1} />
            </View>
            <View style={$rowRight}>
                <Text text={CurrencyUtils.formatWithDelimiter(amount, currencySymbol, 2, true)} style={themed($rowAmount)} />
                {comparePending ? (
                    <Text text={'…'} style={themed($rowDeltaPending)} />
                ) : (
                    <View style={$rowDeltaRow}>
                        <Text
                            text={delta === null ? translate('insights:newSpending') : formatPercent(delta)}
                            style={[themed($rowDelta), { color: deltaColor }]}
                        />
                        <Text text={vsLabel} style={themed($rowVsLabel)} />
                    </View>
                )}
            </View>
        </View>
    );
};

const $metricsRow: ViewStyle = {
    flexDirection: 'row',
    gap: spacing.sm,
};

const $metricCard: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flex: 1,
    height: 120,
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.palette.neutral100,
    borderWidth: 1,
    borderColor: colors.border,
});

const $metricEyebrow: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: colors.textDim,
    fontFamily: typography.fonts.funnelSans.medium,
});

const $metricLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 12,
    color: colors.textDim,
    fontFamily: typography.primary.normal,
    marginBottom: 2,
});

const $metricValue: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 18,
    color: colors.text,
    fontFamily: typography.fonts.funnelSans.medium,
});

const $trendCard: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.palette.neutral100,
    borderWidth: 1,
    borderColor: colors.border,
});

const $trendTitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 16,
    color: colors.text,
    fontFamily: typography.primary.semiBold,
    marginTop: 4,
});

const $trendBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
});

const $trendValue: ThemedStyle<TextStyle> = ({ typography }) => ({
    fontSize: 16,
    fontFamily: typography.fonts.funnelSans.medium,
});

const $sectionHeader: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingBottom: spacing.xs,
    marginBottom: spacing.sm,
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

const $card: ThemedStyle<ViewStyle> = ({ colors }) => ({
    backgroundColor: colors.palette.neutral100,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
});

const $row: ThemedStyle<ViewStyle> = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
});

const $rowBorder: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
});

const $rowLeft: ViewStyle = {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
};

const $rowRight: ViewStyle = {
    alignItems: 'flex-end',
};

const $rowTitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 16,
    color: colors.text,
    fontFamily: typography.primary.medium,
    flexShrink: 1,
});

const $rowAmount: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 16,
    color: colors.text,
    fontFamily: typography.fonts.funnelSans.medium,
    lineHeight: 18,
});

const $rowDeltaRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
};

const $rowDelta: ThemedStyle<TextStyle> = ({ typography }) => ({
    fontSize: 14,
    fontFamily: typography.fonts.funnelSans.bold,
});

const $rowVsLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 12,
    color: colors.textDim,
    fontFamily: typography.primary.normal,
});

const $rowDeltaPending: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 12,
    color: colors.textDim,
    fontFamily: typography.primary.medium,
    marginTop: 2,
});
