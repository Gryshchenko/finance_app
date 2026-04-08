import { Pressable, View, ViewStyle, TextStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Text } from '@/components/Text';
import { TxKeyPath } from '@/i18n/index';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';

export interface SettingsRowProps {
    /** i18n key for the left label */
    labelTx: TxKeyPath;
    /** Optional plain-text value shown on the right */
    value?: string;
    /** Optional MaterialIcons icon shown after the value */
    icon?: React.ComponentProps<typeof MaterialIcons>['name'];
    /** Makes the entire row pressable */
    onPress?: () => void;
    /** When false, renders a bottom border divider (default: false) */
    isLast?: boolean;
}

export function SettingsRow({ labelTx, value, icon, onPress, isLast = false }: SettingsRowProps) {
    const {
        themed,
        theme: { colors },
    } = useAppTheme();

    const inner = (
        <View style={[themed($row), !isLast && themed($rowBorder)]}>
            <Text tx={labelTx} style={themed($label)} />
            <View style={$rightSlot}>
                {value ? <Text text={value} style={themed($value)} /> : null}
                {icon ? <MaterialIcons name={icon} size={18} color={colors.textDim} /> : null}
            </View>
        </View>
    );

    if (onPress) {
        return <Pressable onPress={onPress}>{inner}</Pressable>;
    }
    return inner;
}

const $row: ThemedStyle<ViewStyle> = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
});

const $rowBorder: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
});

const $label: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    fontFamily: typography.primary.medium,
});

const $value: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 14,
    color: colors.textDim,
    fontFamily: typography.primary.normal,
    marginRight: 8,
});

const $rightSlot: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
};
