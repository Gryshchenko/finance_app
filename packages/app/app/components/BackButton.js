import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { translate } from '@/i18n/translate';
import { useAppTheme } from '@/theme/context';
import { $styles } from '@/theme/styles';

export const BackButton = ({ size = 20, onPress }) => {
    const navigation = useNavigation();
    const { themed, theme } = useAppTheme();
    const handlePress = () => {
        if (onPress) onPress();
        else navigation.goBack();
    };
    return (
        <Pressable onPress={handlePress} style={themed([$styles.row, $customLeftAction])} hitSlop={10}>
            <Icon icon="back" color={theme.colors.text} size={size} />
            <Text style={themed([themed([$backAction])])}> {translate('common:back')}</Text>
        </Pressable>
    );
};
const $customLeftAction = () => ({
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
});
const $backAction = () => ({
    position: 'absolute',
    left: 29,
    alignItems: 'center',
    display: 'flex',
});
