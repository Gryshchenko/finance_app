import Animated from 'react-native-reanimated';
import { DropProvider } from 'react-native-reanimated-dnd';

import { useDragOverlay } from '@/components/dashboard/Box/DragOverlayContext';
import DashboardAccountsItem from '@/components/dashboard/DashboardAccountsItem';
import DashboardCategoriesItem from '@/components/dashboard/DashboardCategoriesItem';
import DashboardDraggableItem from '@/components/dashboard/DashboardDraggableItem';
import DashboardIncomesItem from '@/components/dashboard/DashboardIncomesItem';
import { spacing } from '@/theme/spacing';

export default function DashboardItems() {
    const { scrollHandler, scrollRef, onOverlayLayout, dragSessionId } = useDragOverlay();
    return (
        <DropProvider key={dragSessionId}>
            <DashboardDraggableItem />
            <Animated.ScrollView
                ref={scrollRef}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                onLayout={(e) => {
                    onOverlayLayout(e.nativeEvent.layout);
                }}
                contentContainerStyle={{ gap: spacing.md, marginTop: spacing.lg }}
            >
                <DashboardIncomesItem />
                <DashboardAccountsItem />
                <DashboardCategoriesItem />
            </Animated.ScrollView>
        </DropProvider>
    );
}
