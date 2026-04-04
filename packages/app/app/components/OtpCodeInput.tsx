import { useEffect, useState } from 'react';
import { View, ViewStyle, TextStyle } from 'react-native';
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';

import { Text, TextProps } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

type Props = {
    value: string;
    onFinish?: (code: string) => void;
    styles?: ViewStyle[];
    status?: 'error' | 'disabled';
    LabelTextProps?: TextProps;
    /**
     * The helper text to display if not using `helperTx`.
     */
    helper?: TextProps['text'];
    /**
     * Helper text which is looked up via i18n.
     */
    helperTx?: TextProps['tx'];
    /**
     * Optional helper options to pass to i18n. Useful for interpolation
     * as well as explicitly setting locale or translation fallbacks.
     */
    helperTxOptions?: TextProps['txOptions'];
    /**
     * Pass any additional props directly to the helper Text component.
     */
    HelperTextProps?: TextProps;
};

const CELL_COUNT = 8;

export const OtpCodeInput: React.FC<Props> = ({
    styles = [],
    helper,
    helperTx,
    helperTxOptions,
    HelperTextProps,
    onFinish,
    status,
    value: originValue,
}) => {
    const {
        themed,
        theme: { colors },
    } = useAppTheme();
    const [value, setValue] = useState(originValue);
    const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
    const [props, getCellOnLayoutHandler] = useClearByFocusCell({
        value,
        setValue,
    });

    useEffect(() => {
        if (originValue !== value) {
            setValue(originValue);
        }
        // no need add value in dep
    }, [originValue]);

    const $helperStyles = [$helperStyle, status === 'error' && { color: colors.error }, HelperTextProps?.style];

    return (
        <View style={[themed($container), ...styles]}>
            <View style={themed($inputs)}>
                <CodeField
                    ref={ref}
                    {...props}
                    value={value}
                    onChangeText={(code) => {
                        if (code?.length === CELL_COUNT) {
                            onFinish && onFinish(code);
                        }
                        setValue(code);
                    }}
                    cellCount={CELL_COUNT}
                    rootStyle={themed($inputs)}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    testID="my-code-input"
                    renderCell={({ index, symbol, isFocused }) => (
                        <Text
                            key={index}
                            style={[themed($input), isFocused && themed($inputFocus)]}
                            onLayout={getCellOnLayoutHandler(index)}
                        >
                            {symbol || (isFocused && <Cursor />)}
                        </Text>
                    )}
                />
            </View>
            {!!(helper || helperTx) && (
                <Text
                    preset="formHelper"
                    text={helper}
                    tx={helperTx}
                    txOptions={helperTxOptions}
                    {...HelperTextProps}
                    style={themed($helperStyles)}
                />
            )}
        </View>
    );
};

export const $container: ThemedStyle<ViewStyle> = () => ({
    display: 'flex',
    flexDirection: 'column',
    height: 74,
});

export const $inputs: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.xl,
});

const $input: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    width: 30,
    height: 50,
    aspectRatio: 3 / 4,
    backgroundColor: colors.background,
    textAlign: 'center',
    paddingTop: 5,
    verticalAlign: 'middle',
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 18,
    fontFamily: typography.primary.medium,
    padding: 0,
});
const $inputFocus: ThemedStyle<TextStyle> = ({ colors }) => ({
    borderColor: colors.textDim,
});
const $helperStyle: ThemedStyle<TextStyle> = () => ({
    marginTop: -60,
    fontSize: 10,
});
