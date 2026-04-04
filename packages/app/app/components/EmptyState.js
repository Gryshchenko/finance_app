import { Image, View } from 'react-native';

import { translate } from '@/i18n/translate';
import { useAppTheme } from '@/theme/context';

import { Button } from './buttons/Button';
import { Text } from './Text';

const sadFace = require('@assets/images/sad-face.png');
/**
 * A component to use when there is no data to display. It can be utilized to direct the user what to do next.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/EmptyState/}
 * @param {EmptyStateProps} props - The props for the `EmptyState` component.
 * @returns {JSX.Element} The rendered `EmptyState` component.
 */
export function EmptyState(props) {
    const {
        theme,
        themed,
        theme: { spacing },
    } = useAppTheme();
    const EmptyStatePresets = {
        generic: {
            imageSource: sadFace,
            heading: translate('emptyStateComponent:generic.heading'),
            content: translate('emptyStateComponent:generic.content'),
            button: translate('emptyStateComponent:generic.button'),
        },
    };
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
    const $containerStyles = [$containerStyleOverride];
    const $imageStyles = [
        $image,
        (isHeadingPresent || isContentPresent || isButtonPresent) && { marginBottom: spacing.xxxs },
        $imageStyleOverride,
        ImageProps?.style,
    ];
    const $headingStyles = [
        themed($heading),
        isImagePresent && { marginTop: spacing.xxxs },
        (isContentPresent || isButtonPresent) && { marginBottom: spacing.xxxs },
        $headingStyleOverride,
        HeadingTextProps?.style,
    ];
    const $contentStyles = [
        themed($content),
        (isImagePresent || isHeadingPresent) && { marginTop: spacing.xxxs },
        isButtonPresent && { marginBottom: spacing.xxxs },
        $contentStyleOverride,
        ContentTextProps?.style,
    ];
    const $buttonStyles = [
        (isImagePresent || isHeadingPresent || isContentPresent) && { marginTop: spacing.xl },
        $buttonStyleOverride,
        ButtonProps?.style,
    ];
    return (
        <View style={$containerStyles}>
            {isImagePresent && (
                <Image source={imageSource} {...ImageProps} style={$imageStyles} tintColor={theme.colors.palette.neutral900} />
            )}

            {isHeadingPresent && (
                <Text
                    preset="subheading"
                    text={heading}
                    tx={headingTx}
                    txOptions={headingTxOptions}
                    {...HeadingTextProps}
                    style={$headingStyles}
                />
            )}

            {isContentPresent && (
                <Text text={content} tx={contentTx} txOptions={contentTxOptions} {...ContentTextProps} style={$contentStyles} />
            )}

            {isButtonPresent && (
                <Button
                    onPress={buttonOnPress}
                    text={button}
                    tx={buttonTx}
                    txOptions={buttonTxOptions}
                    textStyle={$buttonTextStyleOverride}
                    {...ButtonProps}
                    style={$buttonStyles}
                />
            )}
        </View>
    );
}
const $image = { alignSelf: 'center' };
const $heading = ({ spacing }) => ({
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
});
const $content = ({ spacing }) => ({
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
});
