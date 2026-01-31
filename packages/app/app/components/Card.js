import { Fragment } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '@/theme/context';
import { $styles } from '@/theme/styles';
import { Text } from './Text';
/**
 * Cards are useful for displaying related information in a contained way.
 * If a ListItem displays content horizontally, a Card can be used to display content vertically.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Card/}
 * @param {CardProps} props - The props for the `Card` component.
 * @returns {JSX.Element} The rendered `Card` component.
 */
export function Card(props) {
    const {
        content,
        contentTx,
        contentTxOptions,
        footer,
        footerTx,
        footerTxOptions,
        heading,
        headingTx,
        headingTxOptions,
        ContentComponent,
        HeadingComponent,
        FooterComponent,
        LeftComponent,
        RightComponent,
        verticalAlignment = 'top',
        style: $containerStyleOverride,
        contentStyle: $contentStyleOverride,
        headingStyle: $headingStyleOverride,
        footerStyle: $footerStyleOverride,
        ContentTextProps,
        HeadingTextProps,
        FooterTextProps,
        ...WrapperProps
    } = props;
    const {
        themed,
        theme: { spacing },
    } = useAppTheme();
    const preset = props.preset ?? 'default';
    const isPressable = !!WrapperProps.onPress;
    const isHeadingPresent = !!(HeadingComponent || heading || headingTx);
    const isContentPresent = !!(ContentComponent || content || contentTx);
    const isFooterPresent = !!(FooterComponent || footer || footerTx);
    const Wrapper = isPressable ? TouchableOpacity : View;
    const HeaderContentWrapper = verticalAlignment === 'force-footer-bottom' ? View : Fragment;
    const $containerStyle = [themed($containerPresets[preset]), $containerStyleOverride];
    const $headingStyle = [
        themed($headingPresets[preset]),
        (isFooterPresent || isContentPresent) && { marginBottom: spacing.xxxs },
        $headingStyleOverride,
        HeadingTextProps?.style,
    ];
    const $contentStyle = [
        themed($contentPresets[preset]),
        isHeadingPresent && { marginTop: spacing.xxxs },
        isFooterPresent && { marginBottom: spacing.xxxs },
        $contentStyleOverride,
        ContentTextProps?.style,
    ];
    const $footerStyle = [
        themed($footerPresets[preset]),
        (isHeadingPresent || isContentPresent) && { marginTop: spacing.xxxs },
        $footerStyleOverride,
        FooterTextProps?.style,
    ];
    const $alignmentWrapperStyle = [
        $alignmentWrapper,
        { justifyContent: $alignmentWrapperFlexOptions[verticalAlignment] },
        LeftComponent && { marginStart: spacing.md },
        RightComponent && { marginEnd: spacing.md },
    ];
    return (
        <Wrapper
            style={$containerStyle}
            activeOpacity={0.8}
            accessibilityRole={isPressable ? 'button' : undefined}
            {...WrapperProps}
        >
            {LeftComponent}

            <View style={$alignmentWrapperStyle}>
                <HeaderContentWrapper>
                    {HeadingComponent ||
                        (isHeadingPresent && (
                            <Text
                                weight="bold"
                                text={heading}
                                tx={headingTx}
                                txOptions={headingTxOptions}
                                {...HeadingTextProps}
                                style={$headingStyle}
                            />
                        ))}

                    {ContentComponent ||
                        (isContentPresent && (
                            <Text
                                weight="normal"
                                text={content}
                                tx={contentTx}
                                txOptions={contentTxOptions}
                                {...ContentTextProps}
                                style={$contentStyle}
                            />
                        ))}
                </HeaderContentWrapper>

                {FooterComponent ||
                    (isFooterPresent && (
                        <Text
                            weight="normal"
                            size="xs"
                            text={footer}
                            tx={footerTx}
                            txOptions={footerTxOptions}
                            {...FooterTextProps}
                            style={$footerStyle}
                        />
                    ))}
            </View>

            {RightComponent}
        </Wrapper>
    );
}
const $containerBase = (theme) => ({
    borderRadius: theme.spacing.md,
    padding: theme.spacing.xs,
    borderWidth: 1,
    shadowColor: theme.colors.palette.neutral800,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 12.81,
    elevation: 16,
    minHeight: 96,
});
const $alignmentWrapper = {
    flex: 1,
    alignSelf: 'stretch',
};
const $alignmentWrapperFlexOptions = {
    'top': 'flex-start',
    'center': 'center',
    'space-between': 'space-between',
    'force-footer-bottom': 'space-between',
};
const $containerPresets = {
    default: [
        $styles.row,
        $containerBase,
        (theme) => ({
            backgroundColor: theme.colors.palette.neutral100,
            borderColor: theme.colors.palette.neutral300,
        }),
    ],
    reversed: [
        $styles.row,
        $containerBase,
        (theme) => ({
            backgroundColor: theme.colors.palette.neutral800,
            borderColor: theme.colors.palette.neutral500,
        }),
    ],
};
const $headingPresets = {
    default: [],
    reversed: [(theme) => ({ color: theme.colors.palette.neutral100 })],
};
const $contentPresets = {
    default: [],
    reversed: [(theme) => ({ color: theme.colors.palette.neutral100 })],
};
const $footerPresets = {
    default: [],
    reversed: [(theme) => ({ color: theme.colors.palette.neutral100 })],
};
