import { FC, useCallback, useMemo } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Utils } from 'tenpercent/shared';

import { StatsBar, StatTileConfig } from '@/components/StatsBar';
import { translate } from '@/i18n/translate';
import { useAppTheme } from '@/theme/context';
import { Colors } from '@/theme/types';
import { CurrencyUtils } from '@/utils/CurrencyUtils';

export interface TransactionStatsBarProps {
    /** Amount spent so far this month */
    spentMtd?: number;
    /** Same-period spending last month - used to compute Δ */
    lastMonthSpent?: number;
    /** Amount income so far this month */
    incomeMtd?: number;
    /** Same-period income last month - used to compute Δ */
    lastMonthIncome?: number;
    /** Projected end-of-month spending */
    forecastEom?: number;
    /** Monthly budget cap. Omit or pass 0 to hide the budget tile. */
    budgetTotal?: number;
    /** Amount transfer so far this month */
    transferMtd?: number;
    /** ISO currency code, e.g. "USD" */
    currency: string;
    savingsRate?: number;
}

type DeltaDirection = 'up' | 'down' | 'flat' | 'none';

interface DeltaInfo {
    direction: DeltaDirection;
    label: string;
}

function computeDelta(current: number, previous: number): DeltaInfo {
    if (!previous) {
        return { direction: 'none', label: translate('transactionStatsBar:noData') };
    }
    const pct = ((current - previous) / previous) * 100;
    const rounded = Math.round(Math.abs(pct) * 10) / 10;

    if (pct > 0) return { direction: 'up', label: `+${rounded} %` };
    if (pct < 0) return { direction: 'down', label: `-${rounded} %` };
    return { direction: 'flat', label: `0 %` };
}

type BudgetStatus = 'ok' | 'warning' | 'critical' | 'over';

/**
 * ok       <  70 % - green
 * warning  70–89 % - amber
 * critical 90–99 % - red
 * over    ≥ 100 % - red + "Over budget" label
 */
export function getBudgetStatus(pct: number): BudgetStatus {
    if (pct >= 100) return 'over';
    if (pct >= 90) return 'critical';
    if (pct >= 70) return 'warning';
    return 'ok';
}

export function getBudgetStatusLabel(budgetStatus: BudgetStatus | null, colors: Colors): string {
    switch (budgetStatus) {
        case 'ok':
            return colors.palette.green400;
        case 'warning':
            return '#F59E0B';
        case 'critical':
        case 'over':
            return colors.palette.angry500;
        default:
            return colors.text;
    }
}

export function getBudgetPercent(budgetTotal: number, spentMtd: number): number | null {
    if (!budgetTotal || !spentMtd) return null;
    return Math.round((spentMtd / budgetTotal) * 100);
}

export const TransactionStatsBar: FC<TransactionStatsBarProps> = function TransactionStatsBar(props) {
    const { spentMtd, lastMonthSpent, forecastEom, budgetTotal, currency, transferMtd, incomeMtd, lastMonthIncome, savingsRate } =
        props;

    const { theme } = useAppTheme();
    const { colors } = theme;

    const getDeltaIcon = useCallback((delta: DeltaInfo): 'trending-up' | 'trending-down' | 'trending-flat' => {
        switch (delta.direction) {
            case 'up':
                return 'trending-up';
            case 'down':
                return 'trending-down';
            default:
                return 'trending-flat';
        }
    }, []);

    const budgetPct = useMemo(() => {
        return getBudgetPercent(budgetTotal ?? 0, spentMtd ?? 0);
    }, [spentMtd, budgetTotal]);

    const budgetStatus = useMemo(() => (budgetPct != null ? getBudgetStatus(budgetPct) : null), [budgetPct]);

    const budgetColor = useMemo(() => {
        return getBudgetStatusLabel(budgetStatus, colors);
    }, [budgetStatus, colors]);

    const tiles = useMemo((): StatTileConfig[] => {
        const arr = [];

        if (Utils.isNotNull(spentMtd)) {
            arr.push(
                // Spent MTD
                {
                    label: translate('transactionStatsBar:spentMtd'),
                    value: CurrencyUtils.formatWithDelimiter(spentMtd, currency),
                    valueColor: spentMtd > 0 ? colors.palette.angry500 : colors.text,
                },
            );
        }
        if (Utils.isNotNull(spentMtd) && Utils.isNotNull(lastMonthSpent)) {
            const getDeltaColor = (delta: DeltaInfo) => {
                switch (delta.direction) {
                    case 'up':
                        return colors.palette.angry500;
                    case 'down':
                        return colors.palette.green400;
                    default:
                        return colors.textDim;
                }
            };
            const delta = computeDelta(spentMtd, lastMonthSpent);
            const deltaColor = getDeltaColor(delta);

            arr.push(
                // Δ vs Last Month
                {
                    label: translate('transactionStatsBar:deltaLabel'),
                    value: delta.label,
                    valueColor: deltaColor,
                    rightElement:
                        delta.direction !== 'none' ? (
                            <MaterialIcons name={getDeltaIcon(delta)} size={16} color={deltaColor} />
                        ) : undefined,
                },
            );
        }
        if (Utils.isNotNull(incomeMtd)) {
            arr.push(
                // Income MTD
                {
                    label: translate('transactionStatsBar:incomeMtd'),
                    value: CurrencyUtils.formatWithDelimiter(incomeMtd, currency),
                    valueColor: incomeMtd > 0 ? colors.palette.green400 : colors.text,
                },
            );
        }
        if (Utils.isNotNull(lastMonthIncome) && Utils.isNotNull(incomeMtd)) {
            const getDeltaColor = (delta: DeltaInfo) => {
                switch (delta.direction) {
                    case 'up':
                        return colors.palette.green400;
                    case 'down':
                        return colors.palette.angry500;
                    default:
                        return colors.textDim;
                }
            };
            const delta = computeDelta(incomeMtd, lastMonthIncome);
            const deltaColor = getDeltaColor(delta);
            arr.push(
                // Δ vs Last Month
                {
                    label: translate('transactionStatsBar:deltaLabel'),
                    value: delta.label,
                    valueColor: deltaColor,
                    rightElement:
                        delta.direction !== 'none' ? (
                            <MaterialIcons name={getDeltaIcon(delta)} size={16} color={deltaColor} />
                        ) : undefined,
                },
            );
        }
        if (Utils.isNotNull(budgetPct)) {
            arr.push(
                budgetPct
                    ? {
                          label: translate('transactionStatsBar:budgetPercent'),
                          value: `${budgetPct}%`,
                          valueColor: budgetColor,
                          progress: { filledPercent: budgetPct, color: budgetColor },
                      }
                    : {
                          label: translate('transactionStatsBar:budgetPercent'),
                          value: translate('transactionStatsBar:noData'),
                      },
            );
        }
        if (Utils.isNotNull(transferMtd)) {
            // Forecast EOM
            arr.push({
                label: translate('transactionStatsBar:transferMtd'),
                value: CurrencyUtils.formatWithDelimiter(transferMtd, currency),
            });
        }
        if (Utils.isNotNull(forecastEom)) {
            // Forecast EOM
            arr.push({
                label: translate('transactionStatsBar:forecastEom'),
                value: CurrencyUtils.formatWithDelimiter(forecastEom, currency),
            });
        }
        if (Utils.isNotNull(savingsRate)) {
            arr.push({
                label: translate('transactionStatsBar:savingRate'),
                value: savingsRate ? `${savingsRate} %` : translate('transactionStatsBar:noData'),
                valueColor: savingsRate > 0 ? colors.palette.green400 : savingsRate < 0 ? colors.palette.angry500 : colors.text,
            });
        }
        return arr;
    }, [
        spentMtd,
        lastMonthSpent,
        incomeMtd,
        lastMonthIncome,
        budgetPct,
        transferMtd,
        forecastEom,
        savingsRate,
        currency,
        colors.palette.angry500,
        colors.palette.green400,
        colors.text,
        colors.textDim,
        getDeltaIcon,
        budgetStatus,
        budgetColor,
    ]);

    return <StatsBar tiles={tiles} />;
};
