import { useMemo } from 'react';
import { ViewStyle } from 'react-native';

import { CategoryIconIcon } from '@/components/CategoryIcon';
import ItemBox, { ItemBoxProps, ItemType } from '@/components/dashboard/Box/ItemBox';
import { ColorService } from '@/services/ColorService';
import { setRgbOpacity } from '@/utils/setRgbOpacity';

interface IncomeBoxProps extends Omit<ItemBoxProps, 'type' | 'isDroppable' | 'onDrop' | 'droppableId'> {
    icon: CategoryIconIcon;
}

export function IncomeBox({ title, value, icon, id, onDragStart, onDragEnd, isDraggable, BoxProps }: IncomeBoxProps) {
    const droppableId = `${id}-${ItemType.Income}`;
    const color = useMemo(() => {
        return new ColorService().getIncomeColor(id);
    }, [id]);
    return (
        <ItemBox
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
            }}
        />
    );
}
const $boxDefault = (color: string): ViewStyle => ({
    borderWidth: 0,
    backgroundColor: setRgbOpacity(color, 0.1),
});
