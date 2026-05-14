import { IEntityStats, StatsType } from 'tenpercent/shared';

import { TransactionStatsBar } from '@/components/transaction/TransactionStatsBar';
import { useCurrency } from '@/context/CurrencyContext';

interface IProps {
    statsType: StatsType;
    stats: IEntityStats | null | undefined;
    currencyId: number;
}

export const TransactionStats = ({ statsType, stats, currencyId }: IProps) => {
    const { getCurrencySymbol } = useCurrency();
    if (!stats) return null;
    const { spendMTD, budgetPct, vsLastMonthSpendPct, incomeMTD, vsLastMonthIncomePct } = stats;
    switch (statsType) {
        case StatsType.Account:
            return (
                <TransactionStatsBar
                    spentMtd={spendMTD as number}
                    lastMonthSpent={vsLastMonthSpendPct}
                    incomeMtd={incomeMTD as number}
                    lastMonthIncome={vsLastMonthIncomePct}
                    currency={getCurrencySymbol(currencyId)}
                />
            );
        case StatsType.Income:
            return (
                <TransactionStatsBar
                    lastMonthIncome={vsLastMonthIncomePct}
                    incomeMtd={incomeMTD as number}
                    currency={getCurrencySymbol(currencyId)}
                />
            );
        default: {
            return (
                <TransactionStatsBar
                    spentMtd={spendMTD as number}
                    lastMonthSpent={vsLastMonthSpendPct}
                    budgetTotal={budgetPct}
                    currency={getCurrencySymbol(currencyId)}
                />
            );
        }
    }
};
