import {
    createContext,
    Dispatch,
    FC,
    JSX,
    PropsWithChildren,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { Dimensions, type ViewStyle } from 'react-native';
import {
    ScrollHandlerProcessed,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { AnimatedScrollView } from 'react-native-reanimated/lib/typescript/component/ScrollView';
import { scheduleOnRN } from 'react-native-worklets';

import { IDrag } from '@/components/Box/Box';
import { ItemType } from '@/components/Box/ItemBox';

export interface IDragOverlayLayout {
    width: number | null;
    height: number | null;
    x: number | null;
    y: number | null;
}

export interface IExtendedGridState {
    incomes: { isOpen: boolean };
    accounts: { isOpen: boolean };
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

type ContextType = {
    scrollRef: React.Ref<AnimatedScrollView | null> | null;
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
    setExtendedGrid: Dispatch<SetStateAction<IExtendedGridState>>;
    extendedGrid: IExtendedGridState;
    addZone: (zone: IDragOverlayZone) => void;
    activeZone: IDragOverlayZone | null;
};
const isPointInside = (x: number, y: number, rect: { pageX: number; pageY: number; width: number; height: number }) => {
    return x >= rect.pageX && x <= rect.pageX + rect.width && y >= rect.pageY && y <= rect.pageY + rect.height;
};

export const DragOverlayContext = createContext<ContextType | null>(null);

export const DragOverlayProvider: FC<PropsWithChildren> = ({ children }) => {
    const overlayLayout = useSharedValue<IDragOverlayLayout>({ width: null, height: null, x: null, y: null });

    const zonesRef = useRef<Map<string, IDragOverlayZone>>(new Map());
    const [activeZone, setActiveZone] = useState<IDragOverlayZone | null>(null);

    useEffect(() => {
        return () => {
            zonesRef.current?.clear();
            cleanupDragSessionWithWatchdog();
        };
    }, []);

    const [extendedGrid, setExtendedGrid] = useState<IExtendedGridState>({
        incomes: { isOpen: false },
        accounts: { isOpen: false },
    });

    const scrollY = useSharedValue(0);
    const [dragSessionId, setDragSessionId] = useState<number>(1);
    const [draggedElementId, setDraggedElementId] = useState<string | undefined>(undefined);
    const scrollRef = useRef<AnimatedScrollView>(null);
    const animationTimeoutRef = useRef<number | null>(null);

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

    const cleanupDragSessionWithWatchdog = () => {
        clearAnimationTimeout();
        setDraggedElementId(undefined);
        setDraggedElement(undefined);
    };

    const cleanupDragSessionWithTimeout = () => {
        clearAnimationTimeout();
        // Set watchdog timeout as fallback
        animationTimeoutRef.current = setTimeout(() => {
            cleanupDragSessionWithWatchdog();
        }, ANIMATION_TIMEOUT_MS);
    };

    const resetDragState = () => {
        setDragSessionId((prev) => prev + 1);
    };

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
        const newY = y + scrollY.value - (overlayLayout.value.y ?? 0);
        const duration = 500;
        cleanupDragSessionWithTimeout();
        dragTranslateY.value = withTiming(newY, { duration }, (finished) => {
            if (finished) {
                scheduleOnRN(cleanupDragSessionWithWatchdog);
            }
        });
        dragTranslateX.value = withTiming(newX, { duration }, (finished) => {
            if (finished) {
                scheduleOnRN(cleanupDragSessionWithWatchdog);
            }
        });
    };

    const updateDragPosition = (x: number, y: number) => {
        const newX = x;
        const newY = y + scrollY.value - (overlayLayout.value.y ?? 0);
        for (const zone of zonesRef.current?.values()) {
            const layout = zone.measure;
            const withOffSetX = x;
            const withOffSetY = y - (overlayLayout.value.y ?? 0);
            // const isInside = isPointInside(withOffSetX, withOffSetY, layout);
        }

        if (newX >= 0 && newX <= (overlayLayout.value.width ?? 0) - 56) {
            dragTranslateX.value = newX;
            if (y > SCREEN_HEIGHT - AUTO_SCROLL_EDGE_THRESHOLD) {
                scrollRef.current?.scrollTo({
                    y: scrollY.value + AUTO_SCROLL_SPEED,
                    animated: false,
                });
            }
        }
        if (newY >= 0 && newY + 80 <= (overlayLayout.value.height ?? 0) + scrollY.value) {
            dragTranslateY.value = newY;
            if (y < AUTO_SCROLL_EDGE_THRESHOLD) {
                scrollRef.current?.scrollTo({
                    y: scrollY.value - AUTO_SCROLL_SPEED,
                    animated: false,
                });
            }
        }
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
        extendedGrid,
        setExtendedGrid,
        addZone: (zone: IDragOverlayZone) => {
            if (!zonesRef.current?.has(zone.id)) {
                zonesRef.current?.set(zone.id, zone);
            }
        },
        activeZone,
    };
    return <DragOverlayContext.Provider value={value}>{children}</DragOverlayContext.Provider>;
};

export const useDragOverlay = () => {
    const ctx = useContext(DragOverlayContext);
    if (!ctx) throw new Error('Wrap with DragOverlayProvider');
    return ctx;
};
