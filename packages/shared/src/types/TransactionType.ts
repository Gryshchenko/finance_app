/**
 * Kind of transaction, which decides the required fields.
 *
 * `Income` needs incomeId + accountId, `Expense` needs categoryId + accountId, and
 * `Transafer` needs accountId + targetAccountId (two different accounts).
 */
export enum TransactionType {
    Income = 1,
    Expense = 2,
    Transafer = 3,
}
