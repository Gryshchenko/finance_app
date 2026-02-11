import { useState } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';
import { Draggable, Droppable } from 'react-native-reanimated-dnd';

import { ItemType } from '@/components/Box/ItemBox';
import PulsingBlock from '@/components/Box/PulsingBlock';
import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

export type IDrag = { id: string; type: ItemType };

export interface IBoxProps<T = unknown> {
    id: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    isDraggable?: boolean;
    isDroppable: boolean;
    onDrop: (data: T) => void;
    onDragStart?: (data: IDrag) => void;
    onDragging?: (data: { x: number; y: number; tx: number; ty: number; itemData: IDrag }) => void;
    onDragEnd?: (data: IDrag) => void;
    type: ItemType;
    isActive: boolean;
    setIsActive: (isActive: boolean) => void;
    text?: string;
    styles?: {
        box?: ViewStyle;
        container?: ViewStyle;
    };
}

export function Box({
    children,
    isDraggable,
    id,
    isDroppable,
    onDragStart,
    onDragEnd,
    onDrop,
    onDragging,
    type,
    setIsActive,
    styles,
    isActive,
    text,
}: IBoxProps) {
    const { themed } = useAppTheme();
    const [isDragOn, setIsDragOn] = useState(false);

    const handleActiveChange = (isActive: boolean) => {
        console.log('isDragOn', isActive, id);
        setIsDragOn(isActive);
    };
    const onDragStar = () => {
        setIsActive(true);
        console.log(1);
    };

    const onDragStop = () => {
        setIsActive(false);
        console.log(2);
    };

    return (
        <View style={[themed($base), styles?.container]}>
            <Droppable dropDisabled={!isDroppable} onDrop={onDrop} onActiveChange={handleActiveChange}>
                <Draggable
                    onDragStart={(data) => {
                        onDragStar();
                        onDragStart?.(data);
                    }}
                    onDragEnd={(data) => {
                        onDragStop();
                        onDragEnd?.(data);
                    }}
                    onDragging={onDragging}
                    draggableId={id}
                    dragDisabled={!isDraggable}
                    data={{ id, type }}
                >
                    <PulsingBlock active={isDragOn} style={[themed($iconContainer), styles?.box]}>
                        {text && <Text style={themed($text)}>{text}</Text>}
                    </PulsingBlock>
                </Draggable>
            </Droppable>
            {isActive && <View style={[themed($iconContainer), themed($active)]}></View>}
            {children}
        </View>
    );
}
const $iconContainer: ThemedStyle<ViewStyle> = () => ({
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
});

const $base: ThemedStyle<ViewStyle> = () => ({
    width: 80,
    height: 97,
    alignItems: 'center',
    gap: 8,
});

const $text: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    color: colors.text,
    fontFamily: typography.fonts.funnelSans.bold,
    fontSize: 22,
});

const $active: ThemedStyle<ViewStyle> = ({ colors }) => ({
    position: 'absolute',
    opacity: 0.5,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: -1,
});
