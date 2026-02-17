import { createContext, FC, JSX, PropsWithChildren, useContext, useRef, useState } from 'react';
import { Dimensions, type ViewStyle } from 'react-native';
import { ScrollHandlerProcessed, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { AnimatedScrollView } from 'react-native-reanimated/lib/typescript/component/ScrollView';

import { IDrag } from '@/components/Box/Box';
import { ItemType } from '@/components/Box/ItemBox';

export interface IDragOverlayLayout {
    width: number | null;
    height: number | null;
    x: number | null;
    y: number | null;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const EDGE = 50;
const SPEED = 12;

type ContextType = {
    scrollRef: React.Ref<AnimatedScrollView | null> | null;
    setDraggingType: (type: ItemType | undefined) => void;
    startDrag: (data: IDrag) => void;
    updatePosition: (x: number, y: number, tx?: number, ty?: number) => void;
    endDrag: () => void;
    draggingType?: ItemType;
    element: JSX.Element | undefined;
    scrollHandler: ScrollHandlerProcessed<Record<string, unknown>>;
    animatedStyle: ViewStyle;
    onLayout: (data: IDragOverlayLayout) => void;
    endDragDroppable: () => void;
    uuid: number;
};

export const DragOverlayContext = createContext<ContextType | null>(null);

export const DragOverlayProvider: FC<PropsWithChildren> = ({ children }) => {
    const layout = useSharedValue<IDragOverlayLayout>({ width: null, height: null, x: null, y: null });
    const scrollY = useSharedValue(0);
    const [uuid, setUuid] = useState<number>(1);
    const scrollRef = useRef<AnimatedScrollView>(null);

    const [draggingType, setDraggingType] = useState<ItemType | undefined>(undefined);

    const [element, setElement] = useState<JSX.Element | undefined>(undefined);

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const onLayout = (data: IDragOverlayLayout) => {
        layout.value = {
            x: data.x,
            y: data.y,
            width: data.width,
            height: data.height,
        };
    };
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    }));

    const startDrag = ({ element: newElement }: IDrag) => {
        if (element === undefined) {
            setElement(newElement);
        }
    };

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const updatePosition = (x: number, y: number) => {
        const newX = x;
        const newY = y + scrollY.value - (layout.value.y ?? 0);

        if (newX >= 0 && newX <= (layout.value.width ?? 0) - 56) {
            translateX.value = newX;
            if (y > SCREEN_HEIGHT - EDGE) {
                scrollRef.current?.scrollTo({
                    y: scrollY.value + SPEED,
                    animated: false,
                });
            }
        }
        if (newY >= 0 && newY + 80 <= (layout.value.height ?? 0)) {
            translateY.value = newY;
            if (y < EDGE) {
                scrollRef.current?.scrollTo({
                    y: scrollY.value - SPEED,
                    animated: false,
                });
            }
        }
    };

    const endDrag = () => {
        setElement(undefined);
        translateX.value = 0;
        translateY.value = 0;
    };

    const endDragDroppable = () => {
        setElement(undefined);
        translateX.value = 0;
        translateY.value = 0;
        setUuid((prev) => prev + 1);
    };
    const value = {
        element,
        endDrag,
        updatePosition,
        scrollHandler,
        startDrag,
        animatedStyle,
        draggingType,
        setDraggingType,
        scrollRef,
        onLayout,
        uuid,
        endDragDroppable,
    };
    return <DragOverlayContext.Provider value={value}>{children}</DragOverlayContext.Provider>;
};

export const useDragOverlay = () => {
    const ctx = useContext(DragOverlayContext);
    if (!ctx) throw new Error('Wrap with DragOverlayProvider');
    return ctx;
};
