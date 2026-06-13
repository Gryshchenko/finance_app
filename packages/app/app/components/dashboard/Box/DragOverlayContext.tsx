import {
    createContext,
    Dispatch,
    FC,
    JSX,
    PropsWithChildren,
    Ref,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { Dimensions, type ViewStyle } from 'react-native';
import Animated, {
    ScrollHandlerProcessed,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { DASH_BOARD_BOX_SIZE, IDrag } from '@/components/dashboard/Box/Box';
import { ItemType } from '@/components/dashboard/Box/ItemBox';
import { Logger } from '@/utils/logger/Logger';

// Use the public Animated.ScrollView type instead of an internal import path.
type AnimatedScrollView = React.ElementRef<typeof Animated.ScrollView>;

export interface IDragOverlayLayout {
    width: number | null;
    height: number | null;
    x: number | null;
    y: number | null;
}

export interface IDragOverlayZone {
    id: string;
    measure: {
        pageX: number;
        pageY: number;
        width: number;
        height: number;
    };
    onEnter?: () => void;
    onLeave?: () => void;
    /**
     * Scroll offset captured when this zone was measured. The drag point lives in
     * non-scrolling window space while zones live inside the ScrollView, so the
     * hit-test shifts the measured rect by the delta to the current scroll.
     */
    measuredAtScrollY?: number;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AUTO_SCROLL_EDGE_THRESHOLD = 300;
const AUTO_SCROLL_SPEED = 12;
const ANIMATION_TIMEOUT_MS = 600;
// Pixels of slop added around every edge of a zone so hovering is forgiving.
const ZONE_HIT_SLOP = 10;

const _logger = Logger.Of('DragOverlayContext');

type ContextType = {
    scrollRef: Ref<AnimatedScrollView | null> | null;
    setDraggingItemType: (type: ItemType | undefined) => void;
    initiateItemDrag: (data: IDrag) => void;
    updateDragPosition: (x: number, y: number) => void;
    setInitialDragPosition: (x: number, y: number) => void;
    draggingItemType?: ItemType;
    draggedElement: JSX.Element | undefined;
    scrollHandler: ScrollHandlerProcessed<Record<string, unknown>>;
    draggedElementStyle: ViewStyle;
    onOverlayLayout: (data: IDragOverlayLayout) => void;
    resetDragState: () => void;
    dragSessionId: number;
    setDraggedElementId: Dispatch<SetStateAction<string | undefined>>;
    draggedElementId: string | undefined;
    addZone: (zone: IDragOverlayZone) => void;
    removeZone: (id: string) => void;
    activeZones?: string;
};

const isPointInside = (
    draggableX: number,
    draggableY: number,
    rect: { pageX: number; pageY: number; width: number; height: number },
) => {
    return (
        draggableX > rect.pageX - ZONE_HIT_SLOP &&
        draggableX < rect.pageX + rect.width + ZONE_HIT_SLOP &&
        draggableY > rect.pageY - ZONE_HIT_SLOP &&
        draggableY < rect.pageY + rect.height + ZONE_HIT_SLOP
    );
};

export const DragOverlayContext = createContext<ContextType | null>(null);

export const DragOverlayProvider: FC<PropsWithChildren> = ({ children }) => {
    const overlayLayout = useSharedValue<IDragOverlayLayout>({ width: null, height: null, x: null, y: null });

    const zonesRef = useRef<Map<string, IDragOverlayZone>>(new Map());
    // The single zone the drag point is currently inside (or undefined). A ref,
    // not the activeZones state, so updateDragPosition reads a fresh value every
    // frame without being recreated on each render.
    const activeZoneIdRef = useRef<string | undefined>(undefined);
    const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [activeZones, setActiveZones] = useState<string | undefined>(undefined);
    const scrollY = useSharedValue(0);
    const [dragSessionId, setDragSessionId] = useState<number>(1);
    const [draggedElementId, setDraggedElementId] = useState<string | undefined>(undefined);
    const scrollRef = useRef<AnimatedScrollView>(null);

    const [draggingItemType, setDraggingItemType] = useState<ItemType | undefined>(undefined);
    const [draggedElement, setDraggedElement] = useState<JSX.Element | undefined>(undefined);

    const dragTranslateX = useSharedValue(0);
    const dragTranslateY = useSharedValue(0);

    const clearAnimationTimeout = () => {
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
            animationTimeoutRef.current = null;
        }
    };

    // Stable reference so the cleanup useEffect and withTiming callbacks
    // always call the same function instance.
    const cleanupDragSessionWithWatchdog = useCallback(() => {
        clearAnimationTimeout();
        setDraggedElementId(undefined);
        setDraggedElement(undefined);
    }, []);

    useEffect(() => {
        // Capture ref values so the cleanup closure holds a stable snapshot
        // (satisfies react-hooks/exhaustive-deps for .current access).
        const zones = zonesRef;
        const activeZoneId = activeZoneIdRef;
        return () => {
            zones.current?.clear();
            cleanupDragSessionWithWatchdog();
            activeZoneId.current = undefined;
        };
    }, [cleanupDragSessionWithWatchdog]);

    // addZone always overwrites to keep coordinates fresh after re-layouts.
    // Stamp the scroll offset at measure time so updateDragPosition can correct
    // for list scroll - zones are only re-measured on layout, never on scroll.
    const addZone = useCallback(
        (zone: IDragOverlayZone) => {
            zonesRef.current?.set(zone.id, { ...zone, measuredAtScrollY: scrollY.value });
        },
        [scrollY],
    );

    // Remove a zone when its owning component unmounts so a removed section's
    // stale rect can't keep matching the drag point.
    const removeZone = useCallback((id: string) => {
        zonesRef.current?.delete(id);
    }, []);

    const onOverlayLayout = useCallback(
        (data: IDragOverlayLayout) => {
            overlayLayout.value = {
                x: data.x,
                y: data.y,
                width: data.width,
                height: data.height,
            };
        },
        [overlayLayout],
    );

    const draggedElementStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: dragTranslateX.value }, { translateY: dragTranslateY.value }],
    }));

    const initiateItemDrag = useCallback(
        ({ element: newElement }: IDrag) => {
            if (draggedElement === undefined) {
                setDraggedElement(newElement);
            }
        },
        [draggedElement],
    );

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const setInitialDragPosition = (x: number, y: number) => {
        const newX = x;
        // No scrollY term: the overlay is absolute inside the non-scrolling Screen
        // container, so its translate lives in window space - exactly like the live
        // drag (updateDragPosition sets dragTranslateY = y with no scroll offset).
        // Adding scrollY here shifted the return target by the scroll amount, so
        // the overlay flew off-target and vanished there instead of going home.
        const newY = y;
        const duration = 500;

        // Watchdog: if animations are interrupted, clean up after the timeout.
        clearAnimationTimeout();
        animationTimeoutRef.current = setTimeout(() => {
            cleanupDragSessionWithWatchdog();
        }, ANIMATION_TIMEOUT_MS);

        // Both X and Y animations run concurrently. Use a counter so cleanup
        // fires exactly once when BOTH complete, not once per animation.
        let completedCount = 0;
        const onBothDone = (finished: boolean | undefined) => {
            if (!finished) return;
            completedCount += 1;
            if (completedCount >= 2) {
                // Both done - cancel watchdog and clean up.
                clearAnimationTimeout();
                scheduleOnRN(cleanupDragSessionWithWatchdog);
            }
        };

        dragTranslateY.value = withTiming(newY, { duration }, onBothDone);
        dragTranslateX.value = withTiming(newX, { duration }, onBothDone);

        // The drag is ending: clear the active zone so any grid auto-expanded by
        // hover collapses again, even when the item was released outside a drop
        // target (no onDrop / no DropProvider remount to reset it).
        activeZoneIdRef.current = undefined;
        setActiveZones(undefined);
    };

    const updateDragPosition = (x: number, y: number) => {
        const newX = x;
        const newY = y;

        // The hit-test works in absolute window space: the dnd library reports
        // originX/Y (measure().pageX/pageY) plus the gesture translation, and zones
        // are captured with measureInWindow - the same space. Do NOT subtract
        // overlayLayout.y (the ScrollView sits below the header/summary, so its
        // layout y is a large positive offset that would push the hit-zone down).
        //
        // y arrives with a -DASH_BOARD_BOX_SIZE baked in by Box, which renders the
        // overlay at the finger despite its parent's top inset. Add it back so the
        // hit-test uses the finger's true window position; otherwise the trigger
        // zone sits one element too low and grids only open once the item is dragged
        // a full element past their top edge.
        const currentScrollY = scrollY.value;
        const hitY = y + DASH_BOARD_BOX_SIZE;
        let matchedZoneId: string | undefined;
        for (const zone of zonesRef.current.values()) {
            // Shift the measured rect by how far the list has scrolled since the
            // zone was measured. Zero delta => identical to a fresh measurement,
            // so the unscrolled case is never altered.
            const scrollDelta = currentScrollY - (zone.measuredAtScrollY ?? 0);
            const rect = scrollDelta === 0 ? zone.measure : { ...zone.measure, pageY: zone.measure.pageY - scrollDelta };
            if (isPointInside(x, hitY, rect)) {
                matchedZoneId = zone.id;
                break;
            }
        }

        // Commit the change exactly once, and only on a real transition.
        if (matchedZoneId !== activeZoneIdRef.current) {
            if (activeZoneIdRef.current) _logger.debug(`Left zone ${activeZoneIdRef.current}`);
            if (matchedZoneId) _logger.debug(`Entering zone ${matchedZoneId}`);
            activeZoneIdRef.current = matchedZoneId;
            setActiveZones(matchedZoneId);
        }

        if (newX >= 0 && newX <= (overlayLayout.value.width ?? 0)) {
            dragTranslateX.value = newX;
            if (y > SCREEN_HEIGHT - AUTO_SCROLL_EDGE_THRESHOLD) {
                scrollRef.current?.scrollTo({
                    y: scrollY.value + AUTO_SCROLL_SPEED,
                    animated: false,
                });
            }
        }
        if (newY >= 0 && newY <= (overlayLayout.value.height ?? 0) + scrollY.value + 80) {
            dragTranslateY.value = newY;
            if (y < AUTO_SCROLL_EDGE_THRESHOLD) {
                scrollRef.current?.scrollTo({
                    y: scrollY.value - AUTO_SCROLL_SPEED,
                    animated: false,
                });
            }
        }
    };

    const resetDragState = () => {
        setDragSessionId((prev) => prev + 1);
    };

    const value = {
        draggedElement,
        updateDragPosition,
        scrollHandler,
        initiateItemDrag,
        draggedElementStyle,
        draggingItemType,
        setDraggingItemType,
        scrollRef,
        onOverlayLayout,
        dragSessionId,
        resetDragState,
        setDraggedElementId,
        draggedElementId,
        setInitialDragPosition,
        addZone,
        removeZone,
        activeZones,
    };

    return <DragOverlayContext.Provider value={value}>{children}</DragOverlayContext.Provider>;
};

export const useDragOverlay = () => {
    const ctx = useContext(DragOverlayContext);
    if (!ctx) throw new Error('Wrap with DragOverlayProvider');
    return ctx;
};
