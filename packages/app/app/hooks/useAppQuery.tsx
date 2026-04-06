import { useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

import { QueryStaleTimes } from '@/services/QueryCacheService';

type QueryFn<T> = () => Promise<T>;

/**
 * Thin wrapper around `useQuery`.
 *
 * – Default staleTime comes from QueryCacheService.QueryStaleTimes.list (1 min).
 *   Override per-call via `options.staleTime` using a value from QueryStaleTimes.
 * – Query key SHOULD be a value returned by QueryCacheService.QueryKeys.
 */
export function useAppQuery<TData>(
    key: string | readonly unknown[],
    queryFn: QueryFn<TData>,
    options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>,
): UseQueryResult<TData> {
    return useQuery<TData>({
        queryKey: Array.isArray(key) ? (key as readonly unknown[]) : [key],
        queryFn,
        staleTime: QueryStaleTimes.list,
        refetchOnWindowFocus: false,
        retry: 1,
        ...options,
    });
}

/**
 * Returns an invalidation helper that accepts a list of query keys to
 * invalidate in a single batched call.
 *
 * Keys SHOULD come from InvalidationGroups in QueryCacheService:
 *
 * @example
 *   const invalidateQuery = useInvalidateQuery();
 *   await invalidateQuery(InvalidationGroups.account(form.accountId));
 */
export function useInvalidateQuery(): (keys: readonly (readonly unknown[])[]) => Promise<void[]> {
    const queryClient = useQueryClient();

    return (keys: readonly (readonly unknown[])[]) =>
        Promise.all(keys.map((key) => queryClient.invalidateQueries({ queryKey: key as unknown[] })));
}
