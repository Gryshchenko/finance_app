import { JSX, useEffect, useRef, useState, ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
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
    // Tap vs drag discrimination: timer fires if drag ends before 300 ms and
    // the item never actually moved (wasDragged stays false).
    const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wasDragged = useRef(false);

    // Tracks the last known drag position so the cleanup animation targets
    // the correct screen coordinate instead of always (0, 0).
    const initialOffset = useRef({ x: 0, y: 0 });

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
    const isDragging = id === draggedElementId;

    // Restore overlay to origin and clear dragged ID when the Box unmounts
    // (e.g. when DropProvider re-keys after resetDragState).
    // Capture the ref value inside the effect so the cleanup closure holds
    // a stable snapshot at mount time (satisfies react-hooks/exhaustive-deps).
    useEffect(() => {
        const offset = initialOffset;
        return () => {
            setDraggedElementId(undefined);
            setInitialDragPosition(offset.current.x, offset.current.y - DASH_BOARD_BOX_SIZE);
        };
        // setDraggedElementId and setInitialDragPosition are stable dispatcher
        // references from context — safe to omit from the deps array.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                        // Start a short timer — if the drag ends before it fires
                        // and nothing moved, we treat the gesture as a tap.
                        tapTimerRef.current = setTimeout(() => {
                            tapTimerRef.current = null;
                            if (!wasDragged.current) {
                                onTap?.();
                            }
                        }, 300);
                        onDragStart?.(data);
                    }}
                    onDragEnd={(data) => {
                        // If the timer is still pending the drag ended in < 300 ms.
                        // We cancel the timer and handle the tap here so it only
                        // fires once (not once in the timer + once here).
                        const timerWasPending = !!tapTimerRef.current;
                        if (tapTimerRef.current) {
                            clearTimeout(tapTimerRef.current);
                            tapTimerRef.current = null;
                        }
                        if (!wasDragged.current && timerWasPending) {
                            onTap?.();
                        }
                        wasDragged.current = false;
                        onDragEnd?.(data);
                        setInitialDragPosition(initialOffset.current.x, initialOffset.current.y - DASH_BOARD_BOX_SIZE);
                    }}
                    onDragging={(data) => {
                        // First movement cancels tap detection.
                        if (!wasDragged.current) {
                            wasDragged.current = true;
                            if (tapTimerRef.current) {
                                clearTimeout(tapTimerRef.current);
                                tapTimerRef.current = null;
                            }
                        }

                        setDraggedElementId(data.itemData.id);
                        initialOffset.current.x = data.x;
                        initialOffset.current.y = data.y;

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
