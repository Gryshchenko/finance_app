import { FC } from 'react';
import { ViewStyle } from 'react-native';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Icon } from '@/components/Icon';
import { useAppTheme } from '@/theme/context';
import { $styles } from '@/theme/styles';
import type { ThemedStyle } from '@/theme/types';

interface BackButtonProps {
    size?: number;
    onPress?: () => void;
}

export const AddButton: FC<BackButtonProps> = ({ size = 20, onPress }) => {
    const navigation = useNavigation();
    const { themed, theme } = useAppTheme();

    const handlePress = () => {
        if (onPress) onPress();
        else navigation.goBack();
    };

    return (
        <Pressable onPress={handlePress} style={themed([$styles.row, $customLeftAction])} hitSlop={10}>
            <Icon icon="add" color={theme.colors.text} size={size} />
        </Pressable>
    );
};

const $customLeftAction: ThemedStyle<ViewStyle> = () => ({
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
});
