/**
 * Centralised React-Query cache configuration.
 *
 * Single source of truth for:
 *  – Query keys         → QueryKeys.accounts(), QueryKeys.account(id)
 *  – Stale times        → QueryStaleTimes.list, QueryStaleTimes.dashboard
 *  – Invalidation groups → InvalidationGroups.account(id)
 *
 * Rules:
 *  1. Every `useAppQuery` call MUST use a key from `QueryKeys`.
 *  2. Every `useInvalidateQuery` call MUST use `InvalidationGroups`.
 *  3. Stale times are set per category — never hard-coded at the call site.
 */

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const QueryKeys = {
    // ── List queries ──────────────────────────────────────────────────────
    accounts: () => ['accounts'] as const,
    incomes: () => ['incomes'] as const,
    categories: () => ['categories'] as const,
    /** Pass entityId + type when filtered by a specific account/income/category. */
    transactions: (entityId?: number, entityType?: string) =>
        entityId != null ? (['transactions', entityId, entityType] as const) : (['transactions'] as const),
    currencies: () => ['currencies'] as const,

    // ── Dashboard / summary ───────────────────────────────────────────────
    stats: () => ['stats'] as const,
    balance: () => ['balance'] as const,
    incomesStats: () => ['incomesStats'] as const,
    categoriesStats: () => ['categoriesStats'] as const,

    // ── Exchange rates ────────────────────────────────────────────────────
    rates: (currencyId?: number, sourceCurrencyId?: number) => ['rates', currencyId, sourceCurrencyId] as const,

    // ── Detail queries ────────────────────────────────────────────────────
    account: (id: number) => ['account', id] as const,
    income: (id: number) => ['income', id] as const,
    category: (id: number) => ['category', id] as const,
    transaction: (id: number) => ['transaction', id] as const,
} as const;

// ─── Stale Times (milliseconds) ──────────────────────────────────────────────

export const QueryStaleTimes = {
    /**
     * Near-static reference data that rarely changes (e.g. currencies list).
     * Refetched at most once per hour.
     */
    static: 1000 * 60 * 60, // 1 hour

    /**
     * Exchange rates — change every few minutes in production.
     * Keep reasonably fresh without hammering the exchange API.
     */
    rates: 1000 * 60 * 10, // 10 minutes

    /**
     * Dashboard summary tiles (stats, balance).
     * Users expect near-real-time feedback after every transaction.
     */
    dashboard: 1000 * 30, // 30 seconds

    /**
     * Transaction lists — grow quickly; keep fresh so new items appear soon.
     */
    transactions: 1000 * 30, // 30 seconds

    /**
     * Entity list screens (accounts, incomes, categories).
     * These change less frequently than transactions.
     */
    list: 1000 * 60, // 1 minute

    /**
     * Entity detail screens (single account / income / category / transaction).
     * User is actively looking at one record — longer cache is fine.
     */
    detail: 1000 * 60 * 2, // 2 minutes
} as const;

// ─── Invalidation Groups ─────────────────────────────────────────────────────

/**
 * Returns the complete set of query keys that must be invalidated after a
 * given mutation.  Includes related dashboard caches so the home screen
 * reflects the change immediately without the user having to manually refresh.
 *
 * @example
 *   // Inside a create / update / delete handler:
 *   await invalidateQuery(InvalidationGroups.account(form.accountId));
 */
export const InvalidationGroups = {
    /**
     * Invalidate after create / update / delete an account.
     * Also clears summary stats and total balance shown on the dashboard.
     */
    account: (id?: number): readonly (readonly unknown[])[] => {
        const base: readonly (readonly unknown[])[] = [QueryKeys.accounts(), QueryKeys.stats(), QueryKeys.balance()];
        return id != null ? [...base, QueryKeys.account(id)] : base;
    },

    /**
     * Invalidate after create / update / delete an income source.
     * Also clears income stats tile on the dashboard.
     */
    income: (id?: number): readonly (readonly unknown[])[] => {
        const base: readonly (readonly unknown[])[] = [
            QueryKeys.incomes(),
            QueryKeys.incomesStats(),
            QueryKeys.stats(),
            QueryKeys.balance(),
        ];
        return id != null ? [...base, QueryKeys.income(id)] : base;
    },

    /**
     * Invalidate after create / update / delete a category.
     * Also clears the category stats tile on the dashboard.
     */
    category: (id?: number): readonly (readonly unknown[])[] => {
        const base: readonly (readonly unknown[])[] = [QueryKeys.categories(), QueryKeys.categoriesStats()];
        return id != null ? [...base, QueryKeys.category(id)] : base;
    },

    /**
     * Invalidate after create / update / delete a transaction.
     * Transactions touch account balances, income stats and category stats —
     * all of those caches must be cleared.
     */
    transaction: (id?: number): readonly (readonly unknown[])[] => {
        const base: readonly (readonly unknown[])[] = [
            QueryKeys.transactions(),
            QueryKeys.stats(),
            QueryKeys.balance(),
            QueryKeys.incomesStats(),
            QueryKeys.categoriesStats(),
        ];
        return id != null ? [...base, QueryKeys.transaction(id)] : base;
    },
} as const;
