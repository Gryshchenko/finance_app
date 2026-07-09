import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import Animated from 'react-native-reanimated';
import { DropProvider } from 'react-native-reanimated-dnd';

import { useDragOverlay } from '@/components/dashboard/Box/DragOverlayContext';
import DashboardAccountsItem from '@/components/dashboard/DashboardAccountsItem';
import DashboardCategoriesItem from '@/components/dashboard/DashboardCategoriesItem';
import DashboardDraggableItem from '@/components/dashboard/DashboardDraggableItem';
import DashboardIncomesItem from '@/components/dashboard/DashboardIncomesItem';
import { InvalidationGroups } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import { spacing } from '@/theme/spacing';
import { $styles } from '@/theme/styles';

// How long the pull-to-refresh spinner stays visible. Decoupled from the network
// request so the content always retracts, even if the refetch stalls.
const REFRESH_ANIMATION_MS = 800;

interface Props {
    // Top padding for the scroll content so the first item clears the absolute
    // blur header rather than starting behind it.
    contentPaddingTop?: number;
    // Bottom padding so the last item can clear the absolute blur footer.
    contentPaddingBottom?: number;
}

export default function DashboardItems({ contentPaddingTop = 0, contentPaddingBottom = 0 }: Props) {
    const { scrollHandler, scrollRef, onOverlayLayout, dragSessionId, draggingItemType } = useDragOverlay();
    const queryClient = useQueryClient();

    const [refreshing, setRefreshing] = useState(false);
    // Guard against setState after unmount if the user leaves mid-refresh.
    const isMounted = useRef(true);
    const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        return () => {
            isMounted.current = false;
            if (animationTimer.current) clearTimeout(animationTimer.current);
        };
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);

        let animationDone = false;
        let outcome: 'success' | 'error' | undefined;

        const maybeToast = () => {
            if (!animationDone || outcome === undefined || !isMounted.current) return;
            if (outcome === 'success') ToastService.success({ message: 'dashboardScreen:refreshSuccess' });
            else ToastService.error({ message: 'dashboardScreen:refreshError' });
        };

        if (animationTimer.current) clearTimeout(animationTimer.current);
        animationTimer.current = setTimeout(() => {
            if (isMounted.current) setRefreshing(false);
            animationDone = true;
            maybeToast();
        }, REFRESH_ANIMATION_MS);

        // refetchType: 'all' forces a network request even if react-query treats
        // the query as inactive at this instant (the DropProvider remounts the list
        // subtree on drag sessions), so refresh never just marks the cache stale
        // without actually re-fetching.
        Promise.all(
            InvalidationGroups.dashboard().map((key) =>
                queryClient.invalidateQueries({ queryKey: key as unknown[], refetchType: 'all' }),
            ),
        )
            .then(() => {
                outcome = 'success';
            })
            .catch(() => {
                outcome = 'error';
            })
            .finally(maybeToast);
    }, [queryClient]);

    return (
        <DropProvider key={dragSessionId}>
            <DashboardDraggableItem />
            <Animated.ScrollView
                ref={scrollRef}
                style={$styles.flex1}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                onLayout={(e) => {
                    onOverlayLayout(e.nativeEvent.layout);
                }}
                contentContainerStyle={{
                    gap: spacing.md,
                    paddingTop: contentPaddingTop,
                    paddingBottom: contentPaddingBottom,
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        // Keep the pull-to-refresh spinner below the blur header.
                        progressViewOffset={contentPaddingTop}
                        // Disable pull-to-refresh while a drag is in progress so its
                        // vertical pan can't hijack a drag started at the top of the list.
                        enabled={draggingItemType === undefined}
                    />
                }
            >
                <DashboardIncomesItem />
                <DashboardAccountsItem />
                <DashboardCategoriesItem />
            </Animated.ScrollView>
        </DropProvider>
    );
}
