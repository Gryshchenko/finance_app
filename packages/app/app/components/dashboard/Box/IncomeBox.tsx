import { useMemo } from 'react';
import { ViewStyle } from 'react-native';
import { CategoryIconType } from 'tenpercent/shared';

import ItemBox, { ItemBoxProps, ItemType } from '@/components/dashboard/Box/ItemBox';
import { ColorService } from '@/services/ColorService';
import { setRgbOpacity } from '@/utils/setRgbOpacity';

interface IncomeBoxProps extends Omit<ItemBoxProps, 'type' | 'isDroppable' | 'onDrop' | 'droppableId'> {
    icon: CategoryIconType;
    colorId?: string | null;
}

export function IncomeBox({
    title,
    value,
    icon,
    id,
    colorId,
    onDragStart,
    onDragEnd,
    isDraggable,
    BoxProps,
    onTap,
}: IncomeBoxProps) {
    const droppableId = `${id}-${ItemType.Income}`;
    const color = useMemo(() => {
        return new ColorService().getIncomeColor(id, colorId);
    }, [id, colorId]);
    return (
        <ItemBox
            onTap={onTap}
            type={ItemType.Income}
            id={id}
            droppableId={droppableId}
            title={title}
            value={value}
            isDroppable={false}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDrop={() => null}
            isDraggable={isDraggable}
            BoxProps={{
                BoxDraggableItemProps: {
                    icon,
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
    borderWidth: 0,
    backgroundColor: setRgbOpacity(color, 0.1),
});
