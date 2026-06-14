import { Skeleton } from '@/components/Skeleton';

/**
 * One skeleton block standing in for a whole dashboard section (incomes / accounts /
 * categories) while it loads - intentionally a single block, not one per item.
 */
export function DashboardBlockSkeleton({ height = 96 }: { height?: number }) {
    return <Skeleton height={height} radius={12} />;
}
