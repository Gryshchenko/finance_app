import { View, ViewStyle, TextStyle } from 'react-native';

import { Text } from '@/components/Text';
import { Switch } from '@/components/Toggle/Switch';
import { TxKeyPath } from '@/i18n/index';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';

export interface SettingsSwitchRowProps {
    /** i18n key for the left label */
    labelTx: TxKeyPath;
    /** Current switch state */
    value: boolean;
    /** Called when the user toggles the switch */
    onToggle: (newValue: boolean) => void;
    /** When false, renders a bottom border divider (default: false) */
    isLast?: boolean;
}

export function SettingsSwitchRow({ labelTx, value, onToggle, isLast = false }: SettingsSwitchRowProps) {
    const { themed } = useAppTheme();

    return (
        <View style={[themed($row), !isLast && themed($rowBorder)]}>
            <Text tx={labelTx} style={themed($label)} />
            <Switch value={value} onValueChange={onToggle} />
        </View>
    );
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
