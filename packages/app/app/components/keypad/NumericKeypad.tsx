import { FC } from 'react';
import { Pressable, PressableStateCallbackType, View, ViewStyle } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { $styles } from '@/theme/styles';
import { ThemedStyle } from '@/theme/types';

const KEY_HEIGHT = 64;

export interface KeypadKey {
    label: string;
    value?: string;
    variant?: 'digit' | 'muted';
}

const DEFAULT_ROWS: KeypadKey[][] = [
    [{ label: '7' }, { label: '8' }, { label: '9' }],
    [{ label: '4' }, { label: '5' }, { label: '6' }],
    [{ label: '1' }, { label: '2' }, { label: '3' }],
    [{ label: '.' }, { label: '0' }, { label: '00' }],
];

interface NumericKeypadProps {
    rows?: KeypadKey[][];
    onKeyPress?: (value: string) => void;
    onBackspace?: () => void;
    onClear?: () => void;
    onSubmit?: () => void;
    isSubmitDisabled?: boolean;
}

export const NumericKeypad: FC<NumericKeypadProps> = ({
    rows = DEFAULT_ROWS,
    onKeyPress,
    onBackspace,
    onClear,
    onSubmit,
    isSubmitDisabled = false,
}) => {
    const { themed, theme } = useAppTheme();

    return (
        <View style={themed($keypad)}>
            <View style={$numericSection}>
                {rows.map((row, rowIndex) => (
                    <View key={rowIndex} style={$row}>
                        {row.map((key, keyIndex) => (
                            <KeypadCell key={`${rowIndex}-${keyIndex}`} onPress={() => onKeyPress?.(key.value ?? key.label)}>
                                <Text
                                    size="lg"
                                    weight="medium"
                                    text={key.label}
                                    style={key.variant === 'muted' ? { color: theme.colors.textDim } : undefined}
                                />
                            </KeypadCell>
                        ))}
                    </View>
                ))}
            </View>

            <View style={$utilitySection}>
                <KeypadCell onPress={onBackspace}>
                    <Text size="lg" weight="medium" text="⌫" style={{ color: theme.colors.textDim }} />
                </KeypadCell>
                <KeypadCell onPress={onClear}>
                    <Text size="lg" weight="medium" text="C" style={{ color: theme.colors.textDim }} />
                </KeypadCell>
                <Pressable
                    disabled={isSubmitDisabled}
                    onPress={onSubmit}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isSubmitDisabled }}
                    style={({ pressed }) => [themed($submit), isSubmitDisabled && $disabled, pressed && $submitPressed]}
                >
                    <Icon icon="check" color={theme.colors.palette.neutral100} size={24} />
                </Pressable>
            </View>
        </View>
    );
};

interface KeypadCellProps {
    onPress?: () => void;
    children: React.ReactNode;
}

const KeypadCell: FC<KeypadCellProps> = ({ onPress, children }) => {
    const { themed } = useAppTheme();
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            style={({ pressed }: PressableStateCallbackType) => [themed($cell), pressed && $cellPressed]}
        >
            {children}
        </Pressable>
    );
};

const $keypad: ThemedStyle<ViewStyle> = ({ colors }) => ({
    ...$styles.row,
    borderTopWidth: 1,
    borderColor: colors.border,
});

const $numericSection: ViewStyle = {
    flex: 3,
};

const $utilitySection: ViewStyle = {
    flex: 1,
};

const $row: ViewStyle = {
    ...$styles.row,
    height: KEY_HEIGHT,
};

const $cell: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flex: 1,
    height: KEY_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
});

const $cellPressed: ViewStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
};

const $submit: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tint,
});

const $submitPressed: ViewStyle = {
    opacity: 0.9,
};

const $disabled: ViewStyle = {
    opacity: 0.6,
};
