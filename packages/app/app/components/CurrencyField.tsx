import { FC, useMemo } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';

import { FieldPresets } from '@/components/FieldPresets';
import { Text } from '@/components/Text';
import { TextField, TextFieldAccessoryProps, TextFieldProps } from '@/components/TextField';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle, ThemedStyleArray } from '@/theme/types';
import { CurrencyUtils } from '@/utils/CurrencyUtils';

export interface FieldPresetStyleMap {
    currencySymbol: ThemedStyleArray<TextStyle>;
    leftAccessoryStyle: ThemedStyleArray<ViewStyle>;
}
export interface ICurrencyField extends TextFieldProps {
    currency: string;
    onChangeCleaned: (str: string) => void;
}

export const CurrencyField: FC<ICurrencyField> = ({ value, onChangeCleaned, editable, currency, ...props }) => {
    const { themed } = useAppTheme();

    const CurrencySymbol = useMemo(
        () =>
            // eslint-disable-next-line react/display-name
            ({ style }: TextFieldAccessoryProps) => (
                <View style={style}>
                    <Text style={themed($fieldPresets[props.preset ?? 'default'].currencySymbol)}>
                        {CurrencyUtils.getSymbol(currency)}
                    </Text>
                </View>
            ),
        [currency, props.preset, themed],
    );

    const onChangeText = (text: string) => {
        onChangeCleaned?.(text);
    };

    return (
        <>
            <TextField
                placeholder={CurrencyUtils.formatWithDelimiter(0, undefined)}
                keyboardType="decimal-pad"
                {...props}
                editable={editable}
                value={value}
                onChangeText={onChangeText}
                LeftAccessory={CurrencySymbol}
                leftAccessoryStyle={themed($fieldPresets[props.preset ?? 'default'].leftAccessoryStyle)}
            />
        </>
    );
};

const $currencySymbol: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontFamily: typography.fonts.funnelSans.semiBold,
    alignItems: 'center',
    color: colors.text,
    display: 'flex',
    fontSize: 12,
    justifyContent: 'center',
});
const $leftAccessoryStyle: ThemedStyle<TextStyle> = () => ({
    height: 37,
});

const $currencySymbolUnderlineBig: ThemedStyle<TextStyle> = ({ colors }) => ({
    alignItems: 'center',
    color: colors.text,
    display: 'flex',
    fontSize: 34,
    lineHeight: 0,
    justifyContent: 'center',
});
const $leftAccessoryStyleUnderlineBig: ThemedStyle<TextStyle> = () => ({
    height: '100%',
});

export const $fieldPresets: Record<FieldPresets, FieldPresetStyleMap> = {
    default: {
        currencySymbol: [$currencySymbol],
        leftAccessoryStyle: [$leftAccessoryStyle],
    },
    underline: {
        currencySymbol: [$currencySymbol],
        leftAccessoryStyle: [$leftAccessoryStyle],
    },
    underlineBig: {
        currencySymbol: [$currencySymbolUnderlineBig],
        leftAccessoryStyle: [$leftAccessoryStyleUnderlineBig],
    },
    filled: {
        currencySymbol: [$currencySymbol],
        leftAccessoryStyle: [$leftAccessoryStyle],
    },
    compact: {
        currencySymbol: [$currencySymbol],
        leftAccessoryStyle: [$leftAccessoryStyle],
    },
};
