import { FC, useMemo } from 'react';
import { MaterialIcons } from '@expo/vector-icons';

import { StatsBar, StatTileConfig } from '@/components/StatsBar';
import { translate } from '@/i18n/translate';
import { useAppTheme } from '@/theme/context';
import { CurrencyUtils } from '@/utils/CurrencyUtils';

export interface TransactionStatsBarProps {
    /** Amount spent so far this month */
    spentMtd: number;
    /** Same-period spending last month — used to compute Δ */
    lastMonthSpent: number;
    /** Projected end-of-month spending */
    forecastEom: number;
    /** Monthly budget cap. Omit or pass 0 to hide the budget tile. */
    budgetTotal?: number;
    /** ISO currency code, e.g. "USD" */
    currency: string;
}

type DeltaDirection = 'up' | 'down' | 'flat' | 'none';

interface DeltaInfo {
    direction: DeltaDirection;
    label: string;
}

/**
 * Computes % change between current and previous period.
 *   up   → spent MORE  → red  (bad for expenses)
 *   down → spent LESS  → green (good for expenses)
 *   flat → no change   → grey (neutral)
 *   none → no previous data → show "—"
 */
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
 * ok       <  70 % — green
 * warning  70–89 % — amber
 * critical 90–99 % — red
 * over    ≥ 100 % — red + "Over budget" label
 */
function getBudgetStatus(pct: number): BudgetStatus {
    if (pct >= 100) return 'over';
    if (pct >= 90) return 'critical';
    if (pct >= 70) return 'warning';
    return 'ok';
}

const MOCK: TransactionStatsBarProps = {
    spentMtd: 1452.8,
    lastMonthSpent: 1660.0,
    forecastEom: 2100.0,
    budgetTotal: 3100.0,
    currency: 'USD',
};

export const TransactionStatsBar: FC<Partial<TransactionStatsBarProps>> = function TransactionStatsBar(props) {
    const {
        spentMtd = MOCK.spentMtd,
        lastMonthSpent = MOCK.lastMonthSpent,
        forecastEom = MOCK.forecastEom,
        budgetTotal = MOCK.budgetTotal,
        currency = MOCK.currency,
    } = props;

    const { theme } = useAppTheme();
    const { colors } = theme;

    const delta = useMemo(() => computeDelta(spentMtd, lastMonthSpent), [spentMtd, lastMonthSpent]);

    const deltaColor = useMemo(() => {
        switch (delta.direction) {
            case 'up':
                return colors.palette.angry500;
            case 'down':
                return colors.palette.green400;
            default:
                return colors.textDim;
        }
    }, [delta.direction, colors]);

    const deltaIcon = useMemo((): 'trending-up' | 'trending-down' | 'trending-flat' => {
        switch (delta.direction) {
            case 'up':
                return 'trending-up';
            case 'down':
                return 'trending-down';
            default:
                return 'trending-flat';
        }
    }, [delta.direction]);

    const budgetPct = useMemo(() => {
        if (!budgetTotal) return null;
        return Math.round((spentMtd / budgetTotal) * 100);
    }, [spentMtd, budgetTotal]);

    const budgetStatus = useMemo(() => (budgetPct != null ? getBudgetStatus(budgetPct) : null), [budgetPct]);

    const budgetColor = useMemo(() => {
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
    }, [budgetStatus, colors]);

    const tiles = useMemo(
        (): StatTileConfig[] => [
            // ── Spent MTD ───────────────────────────────────────────────────────
            {
                label: translate('transactionStatsBar:spentMtd'),
                value: CurrencyUtils.formatWithDelimiter(spentMtd, currency),
            },

            // ── Δ vs Last Month ─────────────────────────────────────────────────
            {
                label: translate('transactionStatsBar:deltaLabel'),
                value: delta.label,
                valueColor: deltaColor,
                rightElement:
                    delta.direction !== 'none' ? <MaterialIcons name={deltaIcon} size={16} color={deltaColor} /> : undefined,
            },

            // ── Forecast EOM ────────────────────────────────────────────────────
            {
                label: translate('transactionStatsBar:forecastEom'),
                value: CurrencyUtils.formatWithDelimiter(forecastEom, currency),
            },

            // ── % of Budget ─────────────────────────────────────────────────────
            budgetPct != null
                ? {
                      label: translate('transactionStatsBar:budgetPercent'),
                      value: budgetStatus === 'over' ? translate('transactionStatsBar:overBudget') : `${budgetPct}%`,
                      valueColor: budgetColor,
                      progress: { filledPercent: budgetPct, color: budgetColor },
                  }
                : {
                      label: translate('transactionStatsBar:budgetPercent'),
                      value: translate('transactionStatsBar:noData'),
                  },
        ],
        [spentMtd, currency, delta, deltaColor, deltaIcon, forecastEom, budgetPct, budgetStatus, budgetColor],
    );

    return <StatsBar tiles={tiles} />;
};
