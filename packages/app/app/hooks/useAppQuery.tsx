import { useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

type QueryFn<T> = () => Promise<T>;

export function useAppQuery<TData>(
    key: string | any[],
    queryFn: QueryFn<TData>,
    options?: UseQueryOptions<TData>,
): UseQueryResult<TData> {
    return useQuery<TData>({
        queryKey: Array.isArray(key) ? key : [key],
        queryFn,
        staleTime: 1000 * 5,
        refetchOnWindowFocus: false,
        retry: 1,
        ...options,
    });
}

export function useInvalidateQuery(): (keys: (string | readonly unknown[])[]) => Promise<void[]> {
    const queryClient = useQueryClient();

    return async (keys: (string | readonly unknown[])[]): Promise<void[]> => {
        return Promise.all(
            keys.map(async (key) => await queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] })),
        );
    };
}
