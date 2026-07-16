import { FC } from 'react';
import { StyleProp, ViewStyle, Pressable } from 'react-native';

import { Icon } from '@/components/Icon';
import { useAppTheme } from '@/theme/context';
import { $styles, headerIconSize } from '@/theme/styles';

interface EditButtonProps {
    size?: number;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
}

export const EditButton: FC<EditButtonProps> = ({ size = headerIconSize, onPress, style }) => {
    const { theme } = useAppTheme();

    const handlePress = () => {
        if (onPress) onPress();
    };

    return (
        <Pressable onPress={handlePress} style={[$styles.headerAction, style]}>
            <Icon icon="more" color={theme.colors.text} size={size} />
        </Pressable>
    );
};
