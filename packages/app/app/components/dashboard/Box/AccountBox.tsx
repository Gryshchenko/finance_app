import { useMemo } from 'react';
import { ViewStyle } from 'react-native';
import { CategoryIconType } from '@tenpercent/shared';

import ItemBox, { ItemBoxProps, ItemType } from '@/components/dashboard/Box/ItemBox';
import { ColorService } from '@/services/ColorService';

interface AccountBoxProps extends Omit<ItemBoxProps, 'type' | 'isDragging' | 'setIsDragging' | 'droppableId'> {
    icon: CategoryIconType;
    colorId?: string | null;
}

export function AccountBox({
    title,
    value,
    id,
    colorId,
    isDroppable,
    onDragStart,
    onDragEnd,
    onDrop,
    isDraggable,
    BoxProps,
    onTap,
}: AccountBoxProps) {
    const droppableId = `${id}-${ItemType.Account}`;
    const color = useMemo(() => {
        return new ColorService().getAccountColor(id, colorId);
    }, [id, colorId]);
    return (
        <ItemBox
            onTap={onTap}
            type={ItemType.Account}
            id={id}
            droppableId={droppableId}
            title={title}
            value={value}
            isDroppable={isDroppable}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
            isDraggable={isDraggable}
            BoxProps={{
                BoxDraggableItemProps: {
                    text: title?.[0],
                    icon: undefined,
                    color,
                    styles: {
                        box: [$boxDefault(color)],
                    },
                },
                styles: {
                    container: BoxProps?.styles?.container,
                },
                payload: BoxProps?.payload,
            }}
        />
    );
}
const $boxDefault = (color: string): ViewStyle => ({
    backgroundColor: color,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
    padding: 16,
    borderWidth: 0,
});
