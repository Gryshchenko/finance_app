import { FC } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Pressable } from 'react-native';

import { Icon } from '@/components/Icon';
import { useAppTheme } from '@/theme/context';
import { $styles } from '@/theme/styles';
import type { ThemedStyle } from '@/theme/types';

interface EditButtonProps {
    size?: number;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
}

export const EditButton: FC<EditButtonProps> = ({ size = 20, onPress, style }) => {
    const { themed, theme } = useAppTheme();

    const handlePress = () => {
        if (onPress) onPress();
    };

    return (
        <Pressable onPress={handlePress} style={themed([$styles.row, $customLeftAction, style])} hitSlop={10}>
            <Icon icon="more" color={theme.colors.text} size={size} />
        </Pressable>
    );
};

const $customLeftAction: ThemedStyle<ViewStyle> = () => ({
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
});
