import { ComponentType, forwardRef, Ref, useImperativeHandle, useRef, useState } from 'react';
import {
    ImageStyle,
    StyleProp,
    // eslint-disable-next-line no-restricted-imports
    TextInput,
    TextInputProps,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

import { isRTL } from '@/i18n';
import { translate } from '@/i18n/translate';
import { colors } from '@/theme/colors';
import { useAppTheme } from '@/theme/context';
import { $styles } from '@/theme/styles';
import type { ThemedStyle, ThemedStyleArray } from '@/theme/types';

import { Text, TextProps } from './Text';

export interface TextFieldAccessoryProps {
    style: StyleProp<ViewStyle | TextStyle | ImageStyle>;
    status: TextFieldProps['status'];
    multiline: boolean;
    editable: boolean;
}

export interface TextFieldProps extends Omit<TextInputProps, 'ref'> {
    /**
     * A style modifier for different input states.
     */
    status?: 'error' | 'disabled';
    /**
     * The label text to display if not using `labelTx`.
     */
    label?: TextProps['text'];
    /**
     * Label text which is looked up via i18n.
     */
    labelTx?: TextProps['tx'];
    /**
     * Optional label options to pass to i18n. Useful for interpolation
     * as well as explicitly setting locale or translation fallbacks.
     */
    labelTxOptions?: TextProps['txOptions'];
    /**
     * Pass any additional props directly to the label Text component.
     */
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
    /**
     * The placeholder text to display if not using `placeholderTx`.
     */
    placeholder?: TextProps['text'];
    /**
     * Placeholder text which is looked up via i18n.
     */
    placeholderTx?: TextProps['tx'];
    /**
     * Optional placeholder options to pass to i18n. Useful for interpolation
     * as well as explicitly setting locale or translation fallbacks.
     */
    placeholderTxOptions?: TextProps['txOptions'];
    /**
     * Optional input style override.
     */
    style?: StyleProp<TextStyle>;
    /**
     * Style overrides for the container
     */
    containerStyle?: StyleProp<ViewStyle>;
    /**
     * Style overrides for the input wrapper
     */
    inputWrapperStyle?: StyleProp<ViewStyle>;
    /**
     * An optional component to render on the right side of the input.
     * Example: `RightAccessory={(props) => <Icon icon="ladybug" containerStyle={props.style} color={props.editable ? colors.textDim : colors.text} />}`
     * Note: It is a good idea to memoize this.
     */
    RightAccessory?: ComponentType<TextFieldAccessoryProps>;
    /**
     * An optional component to render on the left side of the input.
     * Example: `LeftAccessory={(props) => <Icon icon="ladybug" containerStyle={props.style} color={props.editable ? colors.textDim : colors.text} />}`
     * Note: It is a good idea to memoize this.
     */
    LeftAccessory?: ComponentType<TextFieldAccessoryProps>;
}

/**
 * A component that allows for the entering and editing of text.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/TextField/}
 * @param {TextFieldProps} props - The props for the `TextField` component.
 * @returns {JSX.Element} The rendered `TextField` component.
 */
export const TextField = forwardRef(function TextField(props: TextFieldProps, ref: Ref<TextInput>) {
    const {
        labelTx,
        label,
        labelTxOptions,
        placeholderTx,
        placeholder,
        placeholderTxOptions,
        helper,
        helperTx,
        helperTxOptions,
        status,
        RightAccessory,
        LeftAccessory,
        HelperTextProps,
        LabelTextProps,
        style: $inputStyleOverride,
        containerStyle: $containerStyleOverride,
        inputWrapperStyle: $inputWrapperStyleOverride,
        ...TextInputProps
    } = props;
    const input = useRef<TextInput>(null);

    const {
        themed,
        theme: { colors },
    } = useAppTheme();

    const [focus, setFocus] = useState<boolean>(false);

    const disabled = TextInputProps.editable === false || status === 'disabled';

    const placeholderContent = placeholderTx ? translate(placeholderTx, placeholderTxOptions) : placeholder;

    const $containerStyles = [themed($containerStyle), $containerStyleOverride];

    const $labelStyles = [$labelStyle, focus ? $labelSelectedStyle : $labelNotSelectedStyle, LabelTextProps?.style];

    const $inputWrapperStyles = [
        $styles.row,
        $inputWrapperStyle,
        focus ? $inputWrapperBorderFocusStyle : $inputWrapperBorderNoFocusStyle,
        status === 'error' && { borderColor: colors.error },
        TextInputProps.multiline && { minHeight: 112 },
        LeftAccessory && { paddingStart: 0 },
        RightAccessory && { paddingEnd: 0 },
        $inputWrapperStyleOverride,
    ];

    const $inputStyles: ThemedStyleArray<TextStyle> = [
        $inputStyle,
        disabled && { color: colors.textDim },
        isRTL && { textAlign: 'right' as TextStyle['textAlign'] },
        TextInputProps.multiline && { height: 'auto' },
        $inputStyleOverride,
    ];

    const $helperStyles = [$helperStyle, status === 'error' && { color: colors.error }, HelperTextProps?.style];

    /**
     *
     */
    function focusInput() {
        if (disabled) return;

        input.current?.focus();
    }

    useImperativeHandle(ref, () => input.current as TextInput);

    return (
        <TouchableOpacity activeOpacity={1} style={$containerStyles} onPress={focusInput} accessibilityState={{ disabled }}>
            {!!(label || labelTx) && (
                <Text
                    preset="formLabel"
                    text={label}
                    tx={labelTx}
                    txOptions={labelTxOptions}
                    {...LabelTextProps}
                    style={themed($labelStyles)}
                />
            )}

            <View style={themed($inputWrapperStyles)}>
                {!!LeftAccessory && (
                    <LeftAccessory
                        style={themed($leftAccessoryStyle)}
                        status={status}
                        editable={!disabled}
                        multiline={TextInputProps.multiline ?? false}
                    />
                )}

                <TextInput
                    ref={input}
                    underlineColorAndroid={colors.transparent}
                    textAlignVertical="top"
                    placeholder={placeholderContent}
                    placeholderTextColor={colors.textDim}
                    onFocus={() => setFocus(true)}
                    onBlur={() => setFocus(false)}
                    {...TextInputProps}
                    editable={!disabled}
                    style={themed($inputStyles)}
                />

                {!!RightAccessory && (
                    <RightAccessory
                        style={themed($rightAccessoryStyle)}
                        status={status}
                        editable={!disabled}
                        multiline={TextInputProps.multiline ?? false}
                    />
                )}
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
        </TouchableOpacity>
    );
});

const $containerStyle: ThemedStyle<TextStyle> = () => ({
    height: 110,
});

const $labelStyle: ThemedStyle<TextStyle> = ({ spacing, typography }) => ({
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: spacing.xxxs,
    marginLeft: 4,
    textTransform: 'uppercase',
    color: colors.textDim,
    fontFamily: typography.fonts.funnelSans.semiBold,
});

const $labelNotSelectedStyle: ThemedStyle<TextStyle> = () => ({
    color: colors.textDim,
});

const $labelSelectedStyle: ThemedStyle<TextStyle> = () => ({
    color: colors.text,
});

const $inputWrapperBorderFocusStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderColor: colors.palette.neutral900,
});
const $inputWrapperBorderNoFocusStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderColor: colors.border,
});

const $inputWrapperStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 0,
    backgroundColor: colors.palette.neutral100,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
});

const $inputStyle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    flex: 1,
    alignSelf: 'stretch',
    fontFamily: typography.primary.normal,
    fontSize: 14,
    height: 54,
    // https://github.com/facebook/react-native/issues/21720#issuecomment-532642093
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textDim,
});

const $helperStyle: ThemedStyle<TextStyle> = ({ spacing }) => ({
    marginTop: spacing.xxxs,
    fontSize: 10,
});

const $rightAccessoryStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.palette.neutral100,
    margin: 'auto',
    marginHorizontal: 10,
});

const $leftAccessoryStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    marginStart: spacing.xs,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
});
