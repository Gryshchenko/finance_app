import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ITutorialRequest, ITutorialResponse } from '@tenpercent/shared';

import { useAppQuery } from '@/hooks/useAppQuery';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { fetchTutorials, TutorialService } from '@/services/TutorialService';

export function useTutorials(options?: { enabled?: boolean }) {
    const queryClient = useQueryClient();
    const { data, isPending, isError } = useAppQuery<ITutorialResponse | null>(QueryKeys.tutorials(), fetchTutorials, {
        staleTime: QueryStaleTimes.detail,
        enabled: options?.enabled,
    });

    const markSeen = useCallback(
        (flag: keyof ITutorialRequest, extras?: Partial<ITutorialRequest>) => {
            const payload: Partial<ITutorialRequest> = { ...extras, [flag]: true };
            queryClient.setQueryData(
                QueryKeys.tutorials(),
                (prev: ITutorialResponse | null | undefined) => ({ ...(prev ?? {}), ...payload }) as ITutorialResponse,
            );
            TutorialService.instance().doPatchTutorials(payload);
        },
        [queryClient],
    );

    return { tutorials: data, isPending, isError, markSeen };
}
