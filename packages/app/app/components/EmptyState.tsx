import { Image, ImageProps, ImageStyle, StyleProp, TextStyle, View, ViewStyle } from 'react-native';

import { translate } from '@/i18n/translate';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { typography } from '@/theme/typography';

import { Button, ButtonProps } from './buttons/Button';
import { Text, TextProps } from './Text';

const sadFace = require('@assets/images/sad-face.png');

interface EmptyStateProps {
    /**
     * An optional prop that specifies the text/image set to use for the empty state.
     */
    preset?: 'generic';
    /**
     * Style override for the container.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * An Image source to be displayed above the heading.
     */
    imageSource?: ImageProps['source'];
    /**
     * Style overrides for image.
     */
    imageStyle?: StyleProp<ImageStyle>;
    /**
     * Pass any additional props directly to the Image component.
     */
    ImageProps?: Omit<ImageProps, 'source'>;
    /**
     * The heading text to display if not using `headingTx`.
     */
    heading?: TextProps['text'];
    /**
     * Heading text which is looked up via i18n.
     */
    headingTx?: TextProps['tx'];
    /**
     * Optional heading options to pass to i18n. Useful for interpolation
     * as well as explicitly setting locale or translation fallbacks.
     */
    headingTxOptions?: TextProps['txOptions'];
    /**
     * Style overrides for heading text.
     */
    headingStyle?: StyleProp<TextStyle>;
    /**
     * Pass any additional props directly to the heading Text component.
     */
    HeadingTextProps?: TextProps;
    /**
     * The content text to display if not using `contentTx`.
     */
    content?: TextProps['text'];
    /**
     * Content text which is looked up via i18n.
     */
    contentTx?: TextProps['tx'];
    /**
     * Optional content options to pass to i18n. Useful for interpolation
     * as well as explicitly setting locale or translation fallbacks.
     */
    contentTxOptions?: TextProps['txOptions'];
    /**
     * Style overrides for content text.
     */
    contentStyle?: StyleProp<TextStyle>;
    /**
     * Pass any additional props directly to the content Text component.
     */
    ContentTextProps?: TextProps;
    /**
     * The button text to display if not using `buttonTx`.
     */
    button?: TextProps['text'];
    /**
     * Button text which is looked up via i18n.
     */
    buttonTx?: TextProps['tx'];
    /**
     * Optional button options to pass to i18n. Useful for interpolation
     * as well as explicitly setting locale or translation fallbacks.
     */
    buttonTxOptions?: TextProps['txOptions'];
    /**
     * Style overrides for button.
     */
    buttonStyle?: ButtonProps['style'];
    /**
     * Style overrides for button text.
     */
    buttonTextStyle?: ButtonProps['textStyle'];
    /**
     * Called when the button is pressed.
     */
    buttonOnPress?: ButtonProps['onPress'];
    /**
     * Pass any additional props directly to the Button component.
     */
    ButtonProps?: ButtonProps;
}

interface EmptyStatePresetItem {
    imageSource: ImageProps['source'];
    heading: TextProps['text'];
    content: TextProps['text'];
    button: TextProps['text'];
}

/**
 * A component to use when there is no data to display. It can be utilized to direct the user what to do next.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/EmptyState/}
 * @param {EmptyStateProps} props - The props for the `EmptyState` component.
 * @returns {JSX.Element} The rendered `EmptyState` component.
 */
export function EmptyState(props: EmptyStateProps) {
    const { theme, themed } = useAppTheme();

    const EmptyStatePresets = {
        generic: {
            imageSource: sadFace,
            heading: translate('emptyStateComponent:generic.heading'),
            content: translate('emptyStateComponent:generic.content'),
            button: translate('emptyStateComponent:generic.button'),
        } as EmptyStatePresetItem,
    } as const;

    const preset = EmptyStatePresets[props.preset ?? 'generic'];

    const {
        button = preset.button,
        buttonTx,
        buttonOnPress,
        buttonTxOptions,
        content = preset.content,
        contentTx,
        contentTxOptions,
        heading = preset.heading,
        headingTx,
        headingTxOptions,
        imageSource = preset.imageSource,
        style: $containerStyleOverride,
        buttonStyle: $buttonStyleOverride,
        buttonTextStyle: $buttonTextStyleOverride,
        contentStyle: $contentStyleOverride,
        headingStyle: $headingStyleOverride,
        imageStyle: $imageStyleOverride,
        ButtonProps,
        ContentTextProps,
        HeadingTextProps,
        ImageProps,
    } = props;

    const isImagePresent = !!imageSource;
    const isHeadingPresent = !!(heading || headingTx);
    const isContentPresent = !!(content || contentTx);
    const isButtonPresent = !!(button || buttonTx);

    return (
        <View style={[$container, $containerStyleOverride]}>
            {isImagePresent && (
                <Image
                    source={imageSource}
                    {...ImageProps}
                    style={[$image, $imageStyleOverride, ImageProps?.style]}
                    tintColor={theme.colors.palette.grey400}
                />
            )}

            {(isHeadingPresent || isContentPresent) && (
                <View style={themed($textBlock)}>
                    {isHeadingPresent && (
                        <Text
                            text={heading}
                            tx={headingTx}
                            txOptions={headingTxOptions}
                            {...HeadingTextProps}
                            style={[themed($heading), $headingStyleOverride, HeadingTextProps?.style]}
                        />
                    )}
                    {isContentPresent && (
                        <Text
                            text={content}
                            tx={contentTx}
                            txOptions={contentTxOptions}
                            {...ContentTextProps}
                            style={[themed($content), $contentStyleOverride, ContentTextProps?.style]}
                        />
                    )}
                </View>
            )}

            {isButtonPresent && (
                <Button
                    preset="reversed"
                    onPress={buttonOnPress}
                    text={button}
                    tx={buttonTx}
                    txOptions={buttonTxOptions}
                    textStyle={$buttonTextStyleOverride}
                    {...ButtonProps}
                    style={[themed($buttonStyle), $buttonStyleOverride, ButtonProps?.style]}
                />
            )}
        </View>
    );
}

const $container: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
};

const $image: ImageStyle = {
    alignSelf: 'center',
    width: 64,
    height: 64,
    marginBottom: 24,
    resizeMode: 'contain',
};

const $textBlock: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xl,
});

const $heading: ThemedStyle<TextStyle> = ({ colors }) => ({
    fontFamily: typography.fonts.funnelSans.medium,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '500',
    color: colors.palette.neutral900,
    textAlign: 'center',
    textTransform: 'uppercase',
});

const $content: ThemedStyle<TextStyle> = ({ colors }) => ({
    fontFamily: typography.primary.normal,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: colors.textDim,
    textAlign: 'center',
    letterSpacing: 0.3,
});

const $buttonStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
    width: '100%',
    borderRadius: 0,
    backgroundColor: colors.palette.neutral900,
    paddingVertical: 16,
});
