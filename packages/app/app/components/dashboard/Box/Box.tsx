import { JSX, useEffect, useRef, useState, ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { Draggable, Droppable } from 'react-native-reanimated-dnd';

import { BoxDraggableItem, IBoxDraggableItem } from '@/components/dashboard/Box/BoxDraggableItem';
import { useDragOverlay } from '@/components/dashboard/Box/DragOverlayContext';
import { ItemType } from '@/components/dashboard/Box/ItemBox';
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

export type IDrag = { id: string; type: ItemType; element?: JSX.Element; payload?: Record<string, unknown> };

export interface IBoxProps<T = unknown> extends IBoxDragAndDrop<T> {
    id: string;
    payload?: Record<string, unknown>;
    droppableId: string;
    children: ReactNode;
    type: ItemType;
    onTap?: () => void;
    styles?: {
        container?: ViewStyle;
    };
    BoxDraggableItemProps?: IBoxDraggableItem;
}

export function Box(props: IBoxProps) {
    const {
        children,
        isDraggable,
        id,
        isDroppable,
        onDragStart,
        onDragEnd,
        onDrop,
        onDragging,
        onTap,
        type,
        styles,
        droppableId,
        BoxDraggableItemProps = {},
        payload,
    } = props;
    const viewRef = useRef<View>(null);
    const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wasDragged = useRef(false);
    const { themed } = useAppTheme();
    const {
        initiateItemDrag,
        updateDragPosition,
        resetDragState,
        draggedElementId,
        setDraggedElementId,
        setInitialDragPosition,
    } = useDragOverlay();
    const [isDragOver, setIsDragOver] = useState(false);

    const initialOffset = { x: 0, y: 0 };

    const offset = useSharedValue<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });

    const isDragging = id === draggedElementId;

    useEffect(() => {
        viewRef?.current?.measureInWindow((x, y, width: number, height: number) => {
            offset.value = { x, y, width, height };
        });
    }, [offset]);

    useEffect(() => {
        return () => {
            setDraggedElementId(undefined);
            setInitialDragPosition(initialOffset.x, initialOffset.y - DASH_BOARD_BOX_SIZE);
        };
    }, [initialOffset.x, initialOffset.y]);

    return (
        <View style={[themed($base), styles?.container]}>
            <Droppable
                onActiveChange={(isActive) => {
                    setIsDragOver(isActive);
                }}
                dropAlignment={'center'}
                dropDisabled={!isDroppable || isDragging}
                onDrop={(data) => {
                    onDrop?.(data);
                    resetDragState();
                }}
            >
                <Draggable
                    collisionAlgorithm={'intersect'}
                    onDragStart={(data) => {
                        wasDragged.current = false;
                        tapTimerRef.current = setTimeout(() => {
                            if (!wasDragged.current) {
                                console.log('tap');
                                onTap?.();
                            }
                            tapTimerRef.current = null;
                        }, 300);
                        onDragStart?.(data);
                    }}
                    onDragEnd={(data) => {
                        if (tapTimerRef.current) {
                            clearTimeout(tapTimerRef.current);
                            tapTimerRef.current = null;
                        }
                        if (!wasDragged.current) {
                            onTap?.();
                        }
                        wasDragged.current = false;
                        onDragEnd?.(data);
                        setInitialDragPosition(initialOffset.x, initialOffset.y - DASH_BOARD_BOX_SIZE);
                    }}
                    onDragging={(data) => {
                        if (!wasDragged.current) {
                            wasDragged.current = true;
                            if (tapTimerRef.current) {
                                clearTimeout(tapTimerRef.current);
                                tapTimerRef.current = null;
                            }
                        }

                        setDraggedElementId(data.itemData.id);
                        initialOffset.x = data.x;
                        initialOffset.y = data.y;

                        initiateItemDrag({
                            element: <BoxDraggableItem {...BoxDraggableItemProps} />,
                            id: data.itemData.id,
                            type: data.itemData.type,
                        });
                        updateDragPosition(data.tx + data.x, data.ty + data.y - DASH_BOARD_BOX_SIZE);
                        onDragging?.(data);
                    }}
                    draggableId={droppableId}
                    dragDisabled={!isDraggable}
                    data={{ id, type, payload }}
                >
                    <BoxDraggableItem
                        ref={viewRef}
                        {...BoxDraggableItemProps}
                        styles={{
                            ...BoxDraggableItemProps.styles,
                            box: [
                                isDragging ? themed($opacity) : undefined,
                                ...(BoxDraggableItemProps.styles?.box ?? []),
                                isDragOver ? themed($dragOver) : undefined,
                            ],
                        }}
                    />
                </Draggable>
                {isDragging && (
                    <BoxDraggableItem
                        {...BoxDraggableItemProps}
                        styles={{
                            ...BoxDraggableItemProps.styles,
                            box: [themed($dragging), ...(BoxDraggableItemProps.styles?.box ?? [])],
                        }}
                    />
                )}
            </Droppable>
            {children}
        </View>
    );
}
const $base: ThemedStyle<ViewStyle> = () => ({
    width: 80,
    height: 97,
    alignItems: 'center',
    gap: 8,
});
const $opacity: ThemedStyle<ViewStyle> = () => ({
    opacity: 0,
    position: 'absolute',
});

const $dragging: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.palette.grey300,
});

const $dragOver: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderStyle: 'dashed',
    borderColor: colors.palette.grey400,
    backgroundColor: colors.palette.grey300,
});
