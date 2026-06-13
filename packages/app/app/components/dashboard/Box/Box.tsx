import { JSX, useEffect, useRef, useState, ReactNode } from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
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
    // The in-flow placeholder shown in the source slot during a drag. Measured on
    // release to send the overlay back to the slot's CURRENT on-screen position.
    const placeholderRef = useRef<View>(null);
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
        setDraggingItemType,
    } = useDragOverlay();

    const [isDragOver, setIsDragOver] = useState(false);
    const isDragging = id === draggedElementId;

    // Clear the dragged ID when the Box unmounts (e.g. when DropProvider re-keys
    // after resetDragState on a successful drop). The overlay's return-to-origin
    // animation is already started by onDragEnd, which always fires before the
    // drop-triggered remount, so we deliberately don't restart it here - that
    // would double-animate the overlay on every drop.
    useEffect(() => {
        return () => {
            setDraggedElementId(undefined);
        };
        // setDraggedElementId is a stable dispatcher reference from context -
        // safe to omit from the deps array.
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
                {isDraggable ? (
                    <>
                        <Draggable
                            collisionAlgorithm={'intersect'}
                            onDragStart={(data) => {
                                wasDragged.current = false;
                                setDraggingItemType(type);
                                tapTimerRef.current = setTimeout(() => {
                                    tapTimerRef.current = null;
                                    if (!wasDragged.current) {
                                        onTap?.();
                                    }
                                }, 300);
                                onDragStart?.(data);
                            }}
                            onDragEnd={(data) => {
                                const timerWasPending = !!tapTimerRef.current;
                                if (tapTimerRef.current) {
                                    clearTimeout(tapTimerRef.current);
                                    tapTimerRef.current = null;
                                }
                                if (!wasDragged.current && timerWasPending) {
                                    onTap?.();
                                }
                                wasDragged.current = false;
                                setDraggingItemType(undefined);
                                onDragEnd?.(data);

                                // Send the overlay back to the source slot's CURRENT on-screen
                                // position. Measuring the in-flow placeholder (instead of reusing
                                // originX/Y captured at drag start) keeps the target correct after
                                // the list scrolled or a grid auto-expanded and shifted the slot.
                                const fallbackX = initialOffset.current.x;
                                const fallbackY = initialOffset.current.y - DASH_BOARD_BOX_SIZE;
                                const placeholderNode = placeholderRef.current;
                                // Settle exactly once: setInitialDragPosition both animates the
                                // overlay home and schedules its cleanup, so it must run even if
                                // measureInWindow never calls back (e.g. the placeholder detached
                                // on a drop-triggered remount). The timer is the safety net.
                                let settled = false;
                                const settle = (x: number, y: number) => {
                                    if (settled) return;
                                    settled = true;
                                    setInitialDragPosition(x, y);
                                };
                                if (placeholderNode) {
                                    placeholderNode.measureInWindow((px, py, pw, ph) => {
                                        const measured = pw > 0 || ph > 0;
                                        settle(measured ? px : fallbackX, measured ? py - DASH_BOARD_BOX_SIZE : fallbackY);
                                    });
                                    setTimeout(() => settle(fallbackX, fallbackY), 50);
                                } else {
                                    settle(fallbackX, fallbackY);
                                }
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
                                ref={placeholderRef}
                                styles={{
                                    ...BoxDraggableItemProps.styles,
                                    box: [$placeholderOverlay, themed($dragging), ...(BoxDraggableItemProps.styles?.box ?? [])],
                                }}
                            />
                        )}
                    </>
                ) : (
                    <Pressable onPress={onTap}>
                        <BoxDraggableItem
                            ref={viewRef}
                            {...BoxDraggableItemProps}
                            styles={{
                                ...BoxDraggableItemProps.styles,
                                box: [...(BoxDraggableItemProps.styles?.box ?? []), isDragOver ? themed($dragOver) : undefined],
                            }}
                        />
                    </Pressable>
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

// Keep the dragged source IN FLOW (just invisible) so the Draggable wrapper keeps
// its size. If it collapses (position:absolute child), the dnd library measures
// itemW/itemH as 0 and "intersect" degenerates to "drag point inside target", so a
// drop/highlight only registers once the item has fully entered the box.
const $opacity: ThemedStyle<ViewStyle> = () => ({
    opacity: 0,
});

// The dashed placeholder overlays the in-flow (invisible) source instead of taking
// its own slot - otherwise the source wrapper + placeholder would claim two slots.
const $placeholderOverlay: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
};

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
