import { memo } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';

import { Box, IBoxProps } from '@/components/dashboard/Box/Box';
import { IBoxDraggableItem } from '@/components/dashboard/Box/BoxDraggableItem';
import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

export enum ItemType {
    Account = 'account',
    Category = 'category',
    Income = 'income',
    AddNew = 'add_new',
}

export interface ItemBoxProps extends Omit<IBoxProps, 'children' | 'styles' | 'onDragging' | 'BoxDraggableItemProps'> {
    id: string;
    title: string;
    value?: string;
    type: ItemType;
    isDraggable?: boolean;
    isDroppable: boolean;
    styles?: Partial<{
        title?: TextStyle;
        value?: TextStyle;
    }>;
    BoxProps?: {
        BoxDraggableItemProps?: IBoxDraggableItem;
        text?: string;
        payload?: Record<string, unknown>;
        styles?: {
            container?: ViewStyle;
        };
    };
}

export default memo(function ItemBox({
    title,
    value,
    id,
    droppableId,
    onDragEnd,
    onDragStart,
    isDroppable,
    onDrop,
    isDraggable,
    type,
    styles,
    BoxProps,
    onTap,
}: ItemBoxProps) {
    const { themed } = useAppTheme();

    return (
        <Box
            onTap={onTap}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
            id={id}
            droppableId={droppableId}
            isDroppable={isDroppable}
            isDraggable={isDraggable}
            type={type}
            BoxDraggableItemProps={BoxProps?.BoxDraggableItemProps}
            styles={BoxProps?.styles}
            payload={BoxProps?.payload}
        >
            <View style={themed($textContainer)}>
                <Text numberOfLines={1} ellipsizeMode="tail" style={[themed($title), styles?.title]}>
                    {title}
                </Text>
                {value && <Text style={[themed($value), styles?.value]}>{value}</Text>}
            </View>
        </Box>
    );
});

const $textContainer: ThemedStyle<ViewStyle> = () => ({
    alignItems: 'center',
    width: 80,
});

const $title: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    overflowWrap: 'break-word',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
    textAlign: 'center',
    fontFamily: typography.fonts.funnelSans.bold,
    lineHeight: 15,
});

const $value: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    marginTop: 2,
    fontSize: 10,
    fontWeight: '500',
    color: colors.textDim,
    fontFamily: typography.fonts.funnelSans.bold,
    lineHeight: 15,
});
