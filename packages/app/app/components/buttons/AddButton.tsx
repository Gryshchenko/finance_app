import { FC } from 'react';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Icon } from '@/components/Icon';
import { useAppTheme } from '@/theme/context';
import { $styles, headerIconSize } from '@/theme/styles';

interface AddButtonProps {
    size?: number;
    onPress?: () => void;
}

export const AddButton: FC<AddButtonProps> = ({ size = headerIconSize, onPress }) => {
    const navigation = useNavigation();
    const { theme } = useAppTheme();

    const handlePress = () => {
        if (onPress) onPress();
        else navigation.goBack();
    };

    return (
        <Pressable onPress={handlePress} style={$styles.headerAction}>
            <Icon icon="add" color={theme.colors.text} size={size} />
        </Pressable>
    );
};
