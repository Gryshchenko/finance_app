import { memo } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';

import { Box, IBoxProps } from '@/components/Box/Box';
import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

export enum ItemType {
    Account = 'account',
    Category = 'category',
    Income = 'income',
    AddNew = 'add_new',
}

export interface ItemBoxProps extends Omit<IBoxProps, 'children' | 'styles' | 'onDragging'> {
    id: string;
    title: string;
    value?: string;
    icon: React.ReactNode;
    type: ItemType;
    isDraggable?: boolean;
    isDroppable: boolean;
    styles?: Partial<{
        title?: TextStyle;
        value?: TextStyle;
    }>;
    BoxProps?: {
        text?: string;
        styles?: {
            box?: ViewStyle;
            container?: ViewStyle;
        };
    };
}

export default memo(function ItemBox({
    title,
    value,
    icon,
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
}: ItemBoxProps) {
    const { themed } = useAppTheme();

    return (
        <Box
            text={BoxProps?.text}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
            id={id}
            droppableId={droppableId}
            isDroppable={isDroppable}
            isDraggable={isDraggable}
            type={type}
            icon={icon}
            styles={BoxProps?.styles}
        >
            <View style={themed($textContainer)}>
                <Text style={[themed($title), styles?.title]}>{title}</Text>
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

const $value: ThemedStyle<any> = ({ colors, typography }) => ({
    marginTop: 2,
    fontSize: 10,
    fontWeight: '500',
    color: colors.textDim,
    fontFamily: typography.fonts.funnelSans.bold,
    lineHeight: 15,
});
