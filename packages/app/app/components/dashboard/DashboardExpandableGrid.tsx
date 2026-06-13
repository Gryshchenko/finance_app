import { useEffect, useRef, useCallback } from 'react';
import { View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, clamp } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useDragOverlay } from '@/components/dashboard/Box/DragOverlayContext';
import { ItemType } from '@/components/dashboard/Box/ItemBox';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

/**
 * How long (ms) the user must hover a draggable item over this grid
 * before it auto-expands to reveal hidden rows.
 */
const HOVER_OPEN_DELAY_MS = 500;

type Props = {
    rowHeight: number;
    rows: number;
    children: React.ReactNode;
    id: string;
    /**
     * Which draggable item types are allowed to auto-expand this grid on hover.
     * If the currently dragged type is NOT in this list the grid stays closed -
     * prevents meaningless auto-opens (e.g. dragging an Income over the Incomes
     * section where no item is droppable).
     *
     * Leave undefined to allow any type (original behaviour, no validation).
     */
    acceptedDragTypes?: ItemType[];
};

export default function DashboardExpandableGrid({ rowHeight, rows, children, id, acceptedDragTypes }: Props) {
    const { themed } = useAppTheme();
    const { addZone, activeZones, draggingItemType } = useDragOverlay();

    const MIN_HEIGHT = rowHeight;
    const MAX_HEIGHT = rowHeight * rows;
    const showHandle = rows >= 2;

    const viewRef = useRef<View>(null);
    const isOpened = useRef(false);
    const height = useSharedValue(MIN_HEIGHT);

    // Tracks whether the grid was opened by drag-hover (not by manual pan gesture).
    // We only auto-close grids that were auto-opened - never touch manually opened ones.
    const wasAutoOpenedByDragRef = useRef(false);

    // Timer that fires after HOVER_OPEN_DELAY_MS to auto-open during a drag.
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearHoverTimer = useCallback(() => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
    }, []);

    const openGrid = useCallback(() => {
        if (isOpened.current) return;
        isOpened.current = true;
        height.value = withSpring(MAX_HEIGHT, { damping: 15, stiffness: 150 });
    }, [MAX_HEIGHT, height]);

    // Opens the grid and marks it as drag-triggered so it can be auto-closed later.
    const openGridByDrag = useCallback(() => {
        wasAutoOpenedByDragRef.current = true;
        openGrid();
    }, [openGrid]);

    const closeGrid = useCallback(() => {
        if (!isOpened.current) return;
        isOpened.current = false;
        wasAutoOpenedByDragRef.current = false;
        height.value = withSpring(MIN_HEIGHT, { damping: 15, stiffness: 150 });
    }, [MIN_HEIGHT, height]);

    /**
     * Returns true if the currently dragged item type is allowed to trigger
     * auto-expand on this grid.  When acceptedDragTypes is not provided every
     * type is accepted (backward-compatible).
     */
    const isDragTypeAccepted = useCallback((): boolean => {
        if (!draggingItemType) return false;
        if (!acceptedDragTypes) return true;
        return acceptedDragTypes.includes(draggingItemType);
    }, [draggingItemType, acceptedDragTypes]);

    useEffect(() => {
        const isHovered = activeZones === `${id}-view`;

        if (isHovered) {
            // Start the hover timer only when:
            // 1. A drag is actually in progress (draggingItemType is set).
            // 2. The dragged type is accepted by this section.
            // 3. The grid is not already open.
            // 4. No timer is already running (clearHoverTimer before scheduling).
            if (draggingItemType && !isOpened.current && isDragTypeAccepted()) {
                clearHoverTimer();
                hoverTimerRef.current = setTimeout(() => {
                    hoverTimerRef.current = null;
                    openGridByDrag();
                }, HOVER_OPEN_DELAY_MS);
            }
        } else {
            // Drag left the zone OR drag ended (draggingItemType → undefined).
            // Cancel any pending hover timer either way.
            clearHoverTimer();
            // Auto-close only if this grid was expanded by a drag-hover.
            // Never forcibly close a grid the user opened manually via pan gesture.
            if (wasAutoOpenedByDragRef.current) {
                closeGrid();
            }
        }

        return () => {
            clearHoverTimer();
        };
    }, [activeZones, id, isDragTypeAccepted, openGridByDrag, closeGrid, clearHoverTimer, draggingItemType]);

    // Re-measure both zones whenever layout changes so drag detection stays
    // accurate after scroll or container resize.
    const measureZones = useCallback(() => {
        viewRef.current?.measureInWindow((x, y, width, heightElement) => {
            addZone({
                id: `${id}-view`,
                measure: { pageX: x, pageY: y, width, height: heightElement },
            });
        });
    }, [addZone, id]);

    // Initial measurement - wait one frame so the layout pass has finished.
    useEffect(() => {
        setTimeout(measureZones, 0);
    }, [measureZones]);

    // Manual pan gesture: allows the user to swipe open / close the grid
    // without relying on the drag-and-drop hover path.
    const gesture = Gesture.Pan()
        .onUpdate((e) => {
            if (!showHandle) return;
            if (isOpened.current && e.translationY > 0) return;
            if (!isOpened.current && e.translationY < 0) return;

            const newHeight = (isOpened.current ? MAX_HEIGHT : MIN_HEIGHT) + e.translationY;
            height.value = clamp(newHeight, MIN_HEIGHT, MAX_HEIGHT);
        })
        .onEnd((e) => {
            if (!showHandle) return;
            const mid = (MIN_HEIGHT + MAX_HEIGHT) / 2;
            if (height.value > mid || e.velocityY > 300) {
                scheduleOnRN(openGrid);
            } else {
                scheduleOnRN(closeGrid);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        height: height.value,
    }));

    return (
        <View ref={viewRef} style={themed($wrapper)} onLayout={measureZones}>
            <GestureDetector gesture={gesture}>
                <Animated.View style={[themed($container), animatedStyle]}>
                    <View style={themed($content)}>{children}</View>
                    {showHandle && <View style={themed($handle)} onLayout={measureZones} />}
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

export const $wrapper: ThemedStyle<ViewStyle> = () => ({
    alignItems: 'center',
    width: '100%',
});

export const $container: ThemedStyle<ViewStyle> = ({ border, colors }) => ({
    width: '100%',
    paddingTop: 10,
    borderRadius: border.borderRadius,
    borderColor: colors.border,
    borderWidth: border.borderWidth,
    backgroundColor: colors.background,
    overflow: 'hidden',
});

export const $handle: ThemedStyle<ViewStyle> = ({ colors, border }) => ({
    width: 40,
    height: 4,
    borderRadius: border.borderRadius,
    backgroundColor: colors.palette.neutral300,
    alignSelf: 'center',
    marginVertical: 8,
    position: 'absolute',
    bottom: 0,
});

export const $content: ThemedStyle<ViewStyle> = () => ({
    overflow: 'hidden',
});
