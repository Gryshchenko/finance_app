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

import { IDrag } from '@/components/dashboard/Box/Box';
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
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AUTO_SCROLL_EDGE_THRESHOLD = 300;
const AUTO_SCROLL_SPEED = 12;
const ANIMATION_TIMEOUT_MS = 600;
// Minimum pixel overlap to consider the drag point "inside" a zone.
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
    activeZones?: string;
};

const isPointInside = (
    draggableX: number,
    draggableY: number,
    rect: { pageX: number; pageY: number; width: number; height: number },
) => {
    return (
        draggableX < rect.pageX + rect.width &&
        draggableX + ZONE_HIT_SLOP > rect.pageX &&
        draggableY < rect.pageY + rect.height &&
        draggableY + ZONE_HIT_SLOP > rect.pageY
    );
};

export const DragOverlayContext = createContext<ContextType | null>(null);

export const DragOverlayProvider: FC<PropsWithChildren> = ({ children }) => {
    const overlayLayout = useSharedValue<IDragOverlayLayout>({ width: null, height: null, x: null, y: null });

    const zonesRef = useRef<Map<string, IDragOverlayZone>>(new Map());
    const activeZoneMapRef = useRef<Map<string, boolean>>(new Map());
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
        const activeZoneMap = activeZoneMapRef;
        return () => {
            zones.current?.clear();
            cleanupDragSessionWithWatchdog();
            activeZoneMap.current?.clear();
        };
    }, [cleanupDragSessionWithWatchdog]);

    // addZone always overwrites to keep coordinates fresh after re-layouts.
    const addZone = useCallback((zone: IDragOverlayZone) => {
        zonesRef.current?.set(zone.id, zone);
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
        const newY = y + scrollY.value;
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
        activeZoneMapRef.current?.clear();
    };

    const updateDragPosition = (x: number, y: number) => {
        const newX = x;
        const newY = y;

        for (const zone of zonesRef.current?.values()) {
            const layout = zone.measure;
            const withOffSetX = x;
            const withOffSetY = y - (overlayLayout.value.y ?? 0);
            const isInside = isPointInside(withOffSetX, withOffSetY, layout);

            if (isInside) {
                if (!activeZoneMapRef.current.get(zone.id)) {
                    activeZoneMapRef.current.set(zone.id, true);
                    _logger.debug(`Entering zone ${zone.id}`);
                    setActiveZones(zone.id);
                }
            } else {
                if (activeZoneMapRef.current.get(zone.id)) {
                    activeZoneMapRef.current.set(zone.id, false);
                    _logger.debug(`Left zone ${zone.id}`);
                    setActiveZones(undefined);
                }
            }
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
        activeZones,
    };

    return <DragOverlayContext.Provider value={value}>{children}</DragOverlayContext.Provider>;
};

export const useDragOverlay = () => {
    const ctx = useContext(DragOverlayContext);
    if (!ctx) throw new Error('Wrap with DragOverlayProvider');
    return ctx;
};
