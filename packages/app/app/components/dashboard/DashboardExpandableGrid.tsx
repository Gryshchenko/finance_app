import { useEffect, useRef, useCallback, useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    clamp,
    interpolateColor,
} from 'react-native-reanimated';
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
    const { themed, theme } = useAppTheme();
    const { addZone, removeZone, activeZones, draggingItemType } = useDragOverlay();

    const MIN_HEIGHT = rowHeight;
    const MAX_HEIGHT = rowHeight * rows;
    const showHandle = rows >= 2;

    const viewRef = useRef<View>(null);
    // Shared value (NOT a ref!) so the pan-gesture worklet reads the live open
    // state on the UI thread. A plain ref is frozen when captured by a worklet, so
    // the close branch saw a stale value and the grid was impossible to drag shut.
    const isOpened = useSharedValue(false);
    const height = useSharedValue(MIN_HEIGHT);
    // 0 → 1 while a compatible item hovers, driving the "charging" border/fill cue.
    const hoverProgress = useSharedValue(0);

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
        if (isOpened.value) return;
        isOpened.value = true;
        height.value = withSpring(MAX_HEIGHT, { damping: 15, stiffness: 150 });
    }, [MAX_HEIGHT, height, isOpened]);

    // Opens the grid and marks it as drag-triggered so it can be auto-closed later.
    const openGridByDrag = useCallback(() => {
        wasAutoOpenedByDragRef.current = true;
        // Fade the charging fill out as the grid expands so the open grid looks normal.
        hoverProgress.value = withTiming(0, { duration: 250 });
        openGrid();
    }, [openGrid, hoverProgress]);

    const closeGrid = useCallback(() => {
        if (!isOpened.value) return;
        isOpened.value = false;
        wasAutoOpenedByDragRef.current = false;
        height.value = withSpring(MIN_HEIGHT, { damping: 15, stiffness: 150 });
    }, [MIN_HEIGHT, height, isOpened]);

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
            if (draggingItemType && !isOpened.value && isDragTypeAccepted()) {
                clearHoverTimer();
                // Visual "charging" cue over the same delay: the border thickens and
                // the fill blends toward the border colour. The timer firing (= the
                // animation finishing) is what actually opens the grid.
                hoverProgress.value = withTiming(1, { duration: HOVER_OPEN_DELAY_MS });
                hoverTimerRef.current = setTimeout(() => {
                    hoverTimerRef.current = null;
                    openGridByDrag();
                }, HOVER_OPEN_DELAY_MS);
            }
        } else {
            // Drag left the zone OR drag ended (draggingItemType → undefined).
            // Cancel the pending open and rewind the charging cue.
            clearHoverTimer();
            hoverProgress.value = withTiming(0, { duration: 160 });
            // Auto-close only if this grid was expanded by a drag-hover.
            // Never forcibly close a grid the user opened manually via pan gesture.
            if (wasAutoOpenedByDragRef.current) {
                closeGrid();
            }
        }

        return () => {
            clearHoverTimer();
        };
        // isOpened is a shared value; its .value is read here only to gate the cue
        // and can't be a hook dependency. The effect already re-runs on the inputs
        // that matter (activeZones / draggingItemType).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeZones, id, isDragTypeAccepted, openGridByDrag, closeGrid, clearHoverTimer, draggingItemType, hoverProgress]);

    // Re-measure the zone whenever layout changes so drag detection stays
    // accurate after a container resize.
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
        const timer = setTimeout(measureZones, 0);
        return () => clearTimeout(timer);
    }, [measureZones]);

    // Drop this grid's zone from the registry on unmount so a removed section's
    // stale rect can't keep matching a drag point.
    useEffect(() => {
        return () => removeZone(`${id}-view`);
    }, [removeZone, id]);

    // Manual pan gesture: allows the user to swipe open / close the grid
    // without relying on the drag-and-drop hover path.
    // Memoised so GestureDetector keeps a stable handler instead of re-attaching a
    // fresh gesture on every render (which could drop an in-progress pan).
    const gesture = useMemo(
        () =>
            Gesture.Pan()
                .onUpdate((e) => {
                    if (!showHandle) return;
                    if (isOpened.value && e.translationY > 0) return;
                    if (!isOpened.value && e.translationY < 0) return;

                    const newHeight = (isOpened.value ? MAX_HEIGHT : MIN_HEIGHT) + e.translationY;
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
                }),
        [showHandle, MIN_HEIGHT, MAX_HEIGHT, openGrid, closeGrid, isOpened, height],
    );

    const animatedStyle = useAnimatedStyle(() => ({
        height: height.value,
    }));

    // Charging cue: thicken the border and blend the fill toward the border colour.
    // At rest (hoverProgress 0) these equal the static $container values, so the
    // idle grid is unchanged.
    // const baseBorderWidth = theme.border.borderWidth;
    const hoverFillStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(hoverProgress.value, [0, 1], [theme.colors.background, theme.colors.border]),
    }));

    return (
        <View ref={viewRef} style={themed($wrapper)} onLayout={measureZones}>
            <GestureDetector gesture={gesture}>
                <Animated.View style={[themed($container), animatedStyle, showHandle && hoverFillStyle]}>
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
