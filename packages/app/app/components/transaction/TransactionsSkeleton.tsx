import { View, ViewStyle } from 'react-native';

import { Skeleton } from '@/components/Skeleton';

const LIST_ROWS = 6;
const $skeletonCard: ViewStyle = { marginBottom: 6 };

/** Placeholder for the stats bar while entity stats load. */
export function TransactionStatsSkeleton() {
    return <Skeleton height={72} radius={12} />;
}

/**
 * Placeholder for the transaction list - a few card-shaped blocks. Only meant for
 * the INITIAL load; pagination (loadMore) appends to the real list, not this.
 */
export function TransactionListSkeleton() {
    return (
        <View>
            {Array.from({ length: LIST_ROWS }).map((_, index) => (
                <Skeleton key={index} height={60} radius={8} style={$skeletonCard} />
            ))}
        </View>
    );
}
