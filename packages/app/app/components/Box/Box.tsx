import { JSX, useEffect, useRef } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { Draggable, Droppable } from 'react-native-reanimated-dnd';

import { useDragOverlay } from '@/components/Box/DragOverlayContext';
import { ItemType } from '@/components/Box/ItemBox';
import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

export const DASH_BOARD_BOX_SIZE: number = 56;

export interface IBoxDragAndDrop<T> {
    onDrop: (data: T) => void;
    onDragStart?: (data: IDrag) => void;
    onDragging?: (data: { x: number; y: number; tx: number; ty: number; itemData: IDrag }) => void;
    onDragEnd?: (data: IDrag) => void;
    isDraggable?: boolean;
    isDroppable: boolean;
}

export type IDrag = { id: string; type: ItemType; element?: JSX.Element };

export interface IBoxProps<T = unknown> extends IBoxDragAndDrop<T> {
    id: string;
    droppableId: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    type: ItemType;
    text?: string;
    styles?: {
        box?: ViewStyle;
        container?: ViewStyle;
    };
}

export function Box(props: IBoxProps) {
    const { children, isDraggable, id, isDroppable, onDragStart, onDragEnd, onDrop, onDragging, type, styles, text } = props;
    const viewRef = useRef<View>(null);
    const { themed } = useAppTheme();
    const { startDrag, updatePosition, endDragDroppable, draggingElementId, setDraggingElementId, onInitialPosition } =
        useDragOverlay();

    const initialOffset = { x: 0, y: 0 };

    const offsetX = useSharedValue(0);
    const offsetY = useSharedValue(0);

    const isDragging = id === draggingElementId;

    useEffect(() => {
        viewRef?.current?.measureInWindow((x, y) => {
            offsetX.value = x - 25;
            offsetY.value = y - 82;
        });
    }, [offsetX, offsetY]);

    useEffect(() => {
        return () => {
            setDraggingElementId(undefined);
            onInitialPosition(initialOffset.x - 25, initialOffset.y - 82);
        };
    }, []);

    return (
        <View style={[themed($base), styles?.container]}>
            <Droppable
                dropAlignment={'center'}
                dropDisabled={!isDroppable || isDragging}
                onDrop={(data) => {
                    onDrop?.(data);
                    endDragDroppable();
                }}
            >
                <Draggable
                    onDragStart={(data) => {
                        onDragStart?.(data);
                    }}
                    onDragEnd={(data) => {
                        onDragEnd?.(data);
                        onInitialPosition(initialOffset.x - 25, initialOffset.y - 82);
                    }}
                    onDragging={(data) => {
                        setDraggingElementId(data.itemData.id);
                        initialOffset.x = data.x;
                        initialOffset.y = data.y;

                        startDrag({
                            element: (
                                <View style={[themed($iconContainer), styles?.box]}>
                                    {text && <Text style={themed($text)}>{text}</Text>}
                                </View>
                            ),
                            id: data.itemData.id,
                            type: data.itemData.type,
                        });
                        updatePosition(data.tx + offsetX.value, data.ty + offsetY.value);
                        onDragging?.(data);
                    }}
                    draggableId={id}
                    dragDisabled={!isDraggable}
                    data={{ id, type }}
                >
                    <View ref={viewRef} style={[themed($iconContainer), styles?.box, isDragging && themed($opacity)]}>
                        {text && <Text style={themed($text)}>{text}</Text>}
                    </View>
                </Draggable>
            </Droppable>
            {children}
        </View>
    );
}
const $iconContainer: ThemedStyle<ViewStyle> = () => ({
    width: DASH_BOARD_BOX_SIZE,
    height: DASH_BOARD_BOX_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
});

const $base: ThemedStyle<ViewStyle> = () => ({
    width: 80,
    height: 97,
    alignItems: 'center',
    gap: 8,
});

const $text: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    color: colors.text,
    fontFamily: typography.fonts.funnelSans.bold,
    fontSize: 22,
});

const $opacity: ThemedStyle<ViewStyle> = () => ({
    opacity: 0,
});
