/**
 * Which entity a per-entity stats request is about.
 *
 * The value selects which table the `entityId` is resolved against and which side of
 * the ledger is summed, so it is a closed set.
 */
export enum StatsType {
    Income = 'income',
    Expense = 'expense',
    Account = 'account',
}
