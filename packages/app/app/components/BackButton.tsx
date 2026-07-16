import { FC } from 'react';
import { useNavigation } from '@react-navigation/native';

import { PressableIcon } from '@/components/Icon';
import { useAppTheme } from '@/theme/context';
import { $styles, headerIconSize } from '@/theme/styles';

interface BackButtonProps {
    size?: number;
    onPress?: () => void;
}

export const BackButton: FC<BackButtonProps> = ({ size = headerIconSize, onPress }) => {
    const navigation = useNavigation();
    const { theme } = useAppTheme();
    const { colors } = theme;

    const handlePress = () => {
        if (onPress) onPress();
        else navigation.goBack();
    };

    return (
        <PressableIcon
            size={size}
            containerStyle={$styles.headerAction}
            icon={'back'}
            color={colors.text}
            disabled={false}
            onPress={handlePress}
        />
    );
};
