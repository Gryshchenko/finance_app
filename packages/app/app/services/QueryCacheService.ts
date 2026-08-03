import { StatsType } from '@tenpercent/shared';

export const QueryKeys = {
    accounts: () => ['accounts'] as const,
    incomes: () => ['incomes'] as const,
    categories: () => ['categories'] as const,
    transactions: (entityId?: number, entityType?: string) =>
        entityId != null ? (['transactions', entityId, entityType] as const) : (['transactions'] as const),
    currencies: () => ['currencies'] as const,
    entityStats: (entityId: number, statsType: StatsType) => ['entityStats', entityId, statsType] as const,

    stats: () => ['stats'] as const,
    balance: () => ['balance'] as const,
    incomesStats: () => ['incomesStats'] as const,
    categoriesStats: () => ['categoriesStats'] as const,
    monthSummary: (monthStart: string) => ['monthSummary', monthStart] as const,
    monthCategoriesStats: (monthStart: string) => ['monthCategoriesStats', monthStart] as const,

    rates: (currencyCode?: string, targetCurrencyCode?: string) => ['rates', currencyCode, targetCurrencyCode] as const,

    account: (id: number) => ['account', id] as const,
    income: (id: number) => ['income', id] as const,
    category: (id: number) => ['category', id] as const,
    transaction: (id: number) => ['transaction', id] as const,

    profile: () => ['profile'] as const,

    sharingConnection: (id: number) => ['sharingConnection', id] as const,
    sharingConnections: () => ['sharingConnections'] as const,
    sharingPendingRequests: () => ['sharingPendingRequests'] as const,
    sharingSentRequests: () => ['sharingSentRequests'] as const,
    sharingGroups: () => ['sharingGroups'] as const,
    sharingGroup: (id: number) => ['sharingGroup', id] as const,
    sharingShareableItems: () => ['sharingShareableItems'] as const,

    clientConfig: () => ['clientConfig'] as const,
    tutorials: () => ['tutorials'] as const,
    selectedGoals: () => ['selectedGoals'] as const,
} as const;

export const QueryStaleTimes = {
    /**
     * Near-static reference data that rarely changes (e.g. currencies list).
     * Refetched at most once per hour.
     */
    static: 1000 * 60 * 60, // 1 hour

    /**
     * Exchange rates - change every few minutes in production.
     * Keep reasonably fresh without hammering the exchange API.
     */
    rates: 1000 * 60 * 10, // 10 minutes

    /**
     * Dashboard summary tiles (stats, balance).
     * Users expect near-real-time feedback after every transaction.
     */
    dashboard: 1000 * 30, // 30 seconds

    /**
     * Transaction lists - grow quickly; keep fresh so new items appear soon.
     */
    transactions: 1000 * 30, // 30 seconds

    /**
     * Entity list screens (accounts, incomes, categories).
     * These change less frequently than transactions.
     */
    list: 1000 * 60, // 1 minute

    /**
     * Entity detail screens (single account / income / category / transaction).
     * User is actively looking at one record - longer cache is fine.
     */
    detail: 1000 * 60 * 2, // 2 minutes
} as const;
export const InvalidationGroups = {
    account: (id?: number): readonly (readonly unknown[])[] => {
        const base: readonly (readonly unknown[])[] = [
            QueryKeys.incomes(),
            QueryKeys.accounts(),
            QueryKeys.stats(),
            QueryKeys.balance(),
        ];
        return id != null ? [...base, QueryKeys.account(id)] : base;
    },

    income: (id?: number): readonly (readonly unknown[])[] => {
        const base: readonly (readonly unknown[])[] = [
            QueryKeys.incomes(),
            QueryKeys.accounts(),
            QueryKeys.incomesStats(),
            QueryKeys.stats(),
            QueryKeys.balance(),
        ];
        return id != null ? [...base, QueryKeys.income(id)] : base;
    },

    category: (id?: number): readonly (readonly unknown[])[] => {
        const base: readonly (readonly unknown[])[] = [QueryKeys.accounts(), QueryKeys.categories(), QueryKeys.categoriesStats()];
        return id != null ? [...base, QueryKeys.category(id)] : base;
    },

    transaction: (id?: number): readonly (readonly unknown[])[] => {
        const base: readonly (readonly unknown[])[] = [
            QueryKeys.accounts(),
            QueryKeys.categories(),
            QueryKeys.transactions(),
            QueryKeys.stats(),
            QueryKeys.balance(),
            QueryKeys.incomesStats(),
            QueryKeys.categoriesStats(),
        ];
        return id != null ? [...base, QueryKeys.transaction(id)] : base;
    },

    /**
     * Everything visible on the dashboard: the three tile lists
     * (incomes / accounts / categories) plus the fixed BalanceSummary
     * (stats + balance). Used by pull-to-refresh.
     */
    dashboard: (): readonly (readonly unknown[])[] => [
        QueryKeys.incomesStats(),
        QueryKeys.accounts(),
        QueryKeys.categoriesStats(),
        QueryKeys.stats(),
        QueryKeys.balance(),
    ],

    sharingConnections: (): readonly (readonly unknown[])[] => [
        QueryKeys.sharingConnections(),
        QueryKeys.sharingPendingRequests(),
        QueryKeys.sharingSentRequests(),
        QueryKeys.sharingGroups(),
    ],

    sharingGroups: (id?: number): readonly (readonly unknown[])[] => {
        const base: readonly (readonly unknown[])[] = [QueryKeys.sharingGroups(), QueryKeys.sharingConnections()];
        return id != null ? [...base, QueryKeys.sharingGroup(id)] : base;
    },

    stats: (): readonly (readonly unknown[])[] => [QueryKeys.stats()],
    balance: (): readonly (readonly unknown[])[] => [QueryKeys.balance()],
    profile: (): readonly (readonly unknown[])[] => [QueryKeys.profile()],
    entityStats: (entityId: number, statsType: StatsType): readonly (readonly unknown[])[] => [
        QueryKeys.entityStats(entityId, statsType),
    ],
} as const;
