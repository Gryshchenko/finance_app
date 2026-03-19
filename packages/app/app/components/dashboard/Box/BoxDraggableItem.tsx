import { RefObject } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';
import { AccountIcon, CategoryIconType } from 'tenpercent/shared';

import { CategoryIcon } from '@/components/CategoryIcon';
import { DASH_BOARD_BOX_SIZE } from '@/components/dashboard/Box/Box';
import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

export interface IBoxDraggableItem {
    text?: string;
    ref?: RefObject<View | null>;
    color?: string;
    icon?: CategoryIconType;
    styles?: {
        box?: Array<ViewStyle | undefined>;
    };
}

export const BoxDraggableItem = ({ text, ref, styles, icon, color }: IBoxDraggableItem) => {
    const { themed } = useAppTheme();
    return (
        <View ref={ref} style={[themed($iconContainer), ...(styles?.box ?? [])]}>
            {icon && <CategoryIcon name={icon ?? AccountIcon.Cash} color={color} size={24} />}
            {text && <Text style={themed($text)}>{text}</Text>}
        </View>
    );
};

const $iconContainer: ThemedStyle<ViewStyle> = ({ border }) => ({
    width: DASH_BOARD_BOX_SIZE,
    height: DASH_BOARD_BOX_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: border.borderWidth,
    borderRadius: border.borderRadius,
});

const $text: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    color: colors.palette.neutral100,
    fontFamily: typography.fonts.funnelSans.bold,
    fontSize: 22,
});
