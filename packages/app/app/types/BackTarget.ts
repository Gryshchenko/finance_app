import type { OverviewPath } from '@/types/OverviewPath';

export type BackTarget = {
    path: OverviewPath;
    screen?: string;
    params?: Record<string, unknown>;
};
