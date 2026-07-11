import { TextStyle, View, ViewStyle } from 'react-native';
import { IBalance, ISummary, StatsPeriod, Time } from '@tenpercent/shared';

import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { useCurrency } from '@/context/CurrencyContext';
import { useAppQuery } from '@/hooks/useAppQuery';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { BalanceService } from '@/services/BalanceService';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { StatsService } from '@/services/StatsService';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';
import { CurrencyUtils } from '@/utils/CurrencyUtils';
import { Logger } from '@/utils/logger/Logger';

export async function fetchStats(): Promise<ISummary | null> {
    try {
        const statsService = StatsService.instance();
        const response = await statsService.doGetStats({
            to: Time.getISODateNowUTC() as string,
            from: Time.toMonthStart(Time.getISODateNowUTC()) as string,
            period: StatsPeriod.Month,
        });
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as ISummary;
            }
            default: {
                return null;
            }
        }
    } catch (e) {
        Logger.Of('BalanceSummary').error(`Fetch stats failed due reason: ${(e as { message: string }).message}`);
        return null;
    }
}

export async function fetchBalance(): Promise<IBalance | null> {
    try {
        const statsService = BalanceService.instance();
        const response = await statsService.doGetBalance();
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as IBalance;
            }
            default: {
                return null;
            }
        }
    } catch (e) {
        Logger.Of('BalanceSummary').error(`Fetch stats failed due reason: ${(e as { message: string }).message}`);
        return null;
    }
}

export const BalanceSummary: React.FC = () => {
    const { data: statsData, isPending: statsPending } = useAppQuery<ISummary | null>(QueryKeys.stats(), fetchStats, {
        staleTime: QueryStaleTimes.dashboard,
    });
    const { data: balanceData, isPending: balancePending } = useAppQuery<IBalance | null>(QueryKeys.balance(), fetchBalance, {
        staleTime: QueryStaleTimes.dashboard,
    });
    const { themed } = useAppTheme();
    const { defaultCurrency } = useCurrency();

    if (statsPending || balancePending) {
        return (
            <View style={themed($container)}>
                <View style={themed($left)}>
                    <Skeleton width={90} height={10} radius={5} style={$skeletonLabelGap} />
                    <Skeleton width={160} height={32} radius={8} />
                </View>
                <View style={themed($right)}>
                    <View style={themed($statBlock)}>
                        <Skeleton width={48} height={10} radius={5} style={$skeletonStatGap} />
                        <Skeleton width={64} height={18} radius={6} />
                    </View>
                    <View style={themed($statBlock)}>
                        <Skeleton width={48} height={10} radius={5} style={$skeletonStatGap} />
                        <Skeleton width={64} height={18} radius={6} />
                    </View>
                </View>
            </View>
        );
    }

    const total = Number(balanceData?.balance) ?? 0;
    const expenses = statsData?.expense_total ?? 0;
    const income = statsData?.income_total ?? 0;
    const [totalInt, totalDecimals] = total.toFixed(2).split('.');

    return (
        <View style={themed($container)}>
            <View style={themed($left)}>
                <Text tx={'common:totalBalance'} style={themed($label)}></Text>
                <View style={themed($totalRow)}>
                    <Text style={themed($totalValue)}>
                        {CurrencyUtils.formatWithDelimiter(totalInt, defaultCurrency, 0, false)}
                    </Text>
                    <Text style={themed($totalDecimals)}>.{totalDecimals}</Text>
                </View>
            </View>
            <View style={themed($right)}>
                <View style={themed($statBlock)}>
                    <Text tx={'common:income'} style={themed($label)}></Text>
                    <Text style={themed($income)}>
                        {income > 0 ? ' +' : ''}
                        {CurrencyUtils.formatWithDelimiter(income, defaultCurrency, 2, true)}
                    </Text>
                </View>

                <View style={themed($statBlock)}>
                    <Text tx={'common:expenses'} style={themed($label)}></Text>
                    <Text style={themed($expenses)}>{CurrencyUtils.formatWithDelimiter(expenses, defaultCurrency, 2, true)}</Text>
                </View>
            </View>
        </View>
    );
};

const $skeletonLabelGap: ViewStyle = { marginBottom: 8 };
const $skeletonStatGap: ViewStyle = { marginBottom: 6 };

export const $container: ThemedStyle<ViewStyle> = () => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',

    paddingHorizontal: 0,
    paddingVertical: 16,
});

export const $left: ThemedStyle<ViewStyle> = () => ({
    flexDirection: 'column',
    display: 'flex',
});

export const $right: ThemedStyle<ViewStyle> = () => ({
    flexDirection: 'row',
    gap: 32,
    marginBottom: 6,
    display: 'flex',
});

export const $totalRow: ThemedStyle<ViewStyle> = () => ({
    flexDirection: 'row',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
});

export const $label: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.textDim,
    marginBottom: 4,
    fontFamily: typography.fonts.funnelSans.medium,
});

export const $totalValue: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 34,
    fontFamily: typography.fonts.funnelSans.bold,
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 34,
});

export const $totalDecimals: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 24,
    fontFamily: typography.fonts.funnelSans.bold,
    color: colors.textDim,
    marginLeft: 2,
});

export const $statBlock: ThemedStyle<ViewStyle> = () => ({
    alignItems: 'flex-end',
});

export const $income: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 18,
    color: colors.palette.green400,
    fontFamily: typography.fonts.funnelSans.medium,
});

export const $expenses: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 18,
    color: colors.palette.neutral900,
    fontFamily: typography.fonts.funnelSans.medium,
});
