export interface IEntityStats {
    spendMTD?: number;
    /** MoM % change. `null` = no comparable base (last month was 0) - show a "new" indicator, not a number. */
    vsLastMonthSpendPct?: number | null;
    budgetTotal?: number;
    transferMTD?: number;
    incomeMTD?: number;
    /** MoM % change. `null` = no comparable base (last month was 0) - show a "new" indicator, not a number. */
    vsLastMonthIncomePct?: number | null;
    savingsRate?: number | null;
}
