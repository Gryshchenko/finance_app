import { ViewStyle } from 'react-native';

import ItemBox, { ItemBoxProps, ItemType } from '@/components/Box/ItemBox';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

interface CategoryBoxProps
    extends Omit<
        ItemBoxProps,
        'type' | 'onDragStart' | 'onDragEnd' | 'isDraggable' | 'isDragging' | 'setIsDragging' | 'droppableId'
    > {}

export function CategoryBox({ title, value, icon, id, isDroppable, onDrop, BoxProps }: CategoryBoxProps) {
    const droppableId = `${id}-${ItemType.Category}`;
    const { themed } = useAppTheme();
    return (
        <ItemBox
            type={ItemType.Category}
            id={id}
            droppableId={droppableId}
            title={title}
            icon={icon}
            value={value}
            isDroppable={isDroppable}
            onDragStart={() => null}
            onDragEnd={() => null}
            onDrop={onDrop}
            isDraggable={false}
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
