import { TextStyle, View, ViewStyle } from 'react-native';
import { IBalance, ISummary, StatsPeriod, Time } from 'tenpercent/shared';

import { Text } from '@/components/Text';
import { useCurrency } from '@/context/CurrencyContext';
import { useAppQuery } from '@/hooks/useAppQuery';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { BalanceService } from '@/services/BalanceService';
import { StatsService } from '@/services/StatsService';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';
import { CurrencyUtils } from '@/utils/CurrencyUtils';
import { Logger } from '@/utils/logger/Logger';

export async function fetchStats(): Promise<ISummary | undefined> {
    try {
        const statsService = StatsService.instance();
        const response = await statsService.doGetStats({
            to: Time.toMonthEndExclusive(Time.getISODateNow()) as string,
            from: Time.toMonthStart(Time.getISODateNow()) as string,
            period: StatsPeriod.Month,
        });
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as ISummary;
            }
            default: {
                return undefined;
            }
        }
    } catch (e) {
        Logger.Of('BalanceSummary').error(`Fetch stats failed due reason: ${(e as { message: string }).message}`);
        return undefined;
    }
}

export async function fetchBalance(): Promise<IBalance | undefined> {
    try {
        const statsService = BalanceService.instance();
        const response = await statsService.doGetBalance();
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as IBalance;
            }
            default: {
                return undefined;
            }
        }
    } catch (e) {
        Logger.Of('BalanceSummary').error(`Fetch stats failed due reason: ${(e as { message: string }).message}`);
        return undefined;
    }
}
type Props = {};

export const BalanceSummary: React.FC<Props> = () => {
    const { data: statsData } = useAppQuery<ISummary | undefined>('stats', fetchStats);
    const { data: balanceData } = useAppQuery<IBalance | undefined>('balance', fetchBalance);
    const { themed } = useAppTheme();
    const { defaultCurrency } = useCurrency();
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
                        {income > 0 ? '+' : ''}
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
