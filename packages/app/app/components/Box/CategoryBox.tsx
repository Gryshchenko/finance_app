import { useState } from 'react';
import { ViewStyle } from 'react-native';

import { ItemBox, ItemBoxProps, ItemType } from '@/components/Box/ItemBox';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

interface CategoryBoxProps
    extends Omit<ItemBoxProps, 'type' | 'onDragStart' | 'onDragEnd' | 'isDraggable' | 'isActive' | 'setIsActive'> {}

export function CategoryBox({ title, value, icon, id, isDroppable, onDragging, onDrop, BoxProps }: CategoryBoxProps) {
    const droppableId = `${id}-${ItemType.Category}`;
    const [isActive, setIsActive] = useState<boolean>(false);
    const { themed } = useAppTheme();
    return (
        <ItemBox
            type={ItemType.Category}
            id={droppableId}
            title={title}
            icon={icon}
            value={value}
            isDroppable={isDroppable}
            onDragStart={() => null}
            onDragEnd={() => null}
            onDragging={onDragging}
            onDrop={onDrop}
            isDraggable={false}
            isActive={isActive}
            setIsActive={setIsActive}
            BoxProps={{
                styles: {
                    box: themed($boxDefault),
                    container: BoxProps?.styles?.container,
                },
            }}
        />
    );
}

const $boxDefault: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderColor: colors.border,
    shadowColor: colors.border,
    backgroundColor: colors.palette.neutral100,
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,

    elevation: 4,
});
