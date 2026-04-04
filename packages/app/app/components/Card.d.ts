import { ReactElement } from 'react';
import { StyleProp, TextStyle, TouchableOpacityProps } from 'react-native';

import { TextProps } from './Text';

type Presets = 'default' | 'reversed';
interface CardProps extends TouchableOpacityProps {
    /**
     * One of the different types of text presets.
     */
    preset?: Presets;
    /**
     * How the content should be aligned vertically. This is especially (but not exclusively) useful
     * when the card is a fixed height but the content is dynamic.
     *
     * `top` (default) - aligns all content to the top.
     * `center` - aligns all content to the center.
     * `space-between` - spreads out the content evenly.
     * `force-footer-bottom` - aligns all content to the top, but forces the footer to the bottom.
     */
    verticalAlignment?: 'top' | 'center' | 'space-between' | 'force-footer-bottom';
    /**
     * Custom component added to the left of the card body.
     */
    LeftComponent?: ReactElement;
    /**
     * Custom component added to the right of the card body.
     */
    RightComponent?: ReactElement;
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
     * Custom heading component.
     * Overrides all other `heading*` props.
     */
    HeadingComponent?: ReactElement;
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
     * Custom content component.
     * Overrides all other `content*` props.
     */
    ContentComponent?: ReactElement;
    /**
     * The footer text to display if not using `footerTx`.
     */
    footer?: TextProps['text'];
    /**
     * Footer text which is looked up via i18n.
     */
    footerTx?: TextProps['tx'];
    /**
     * Optional footer options to pass to i18n. Useful for interpolation
     * as well as explicitly setting locale or translation fallbacks.
     */
    footerTxOptions?: TextProps['txOptions'];
    /**
     * Style overrides for footer text.
     */
    footerStyle?: StyleProp<TextStyle>;
    /**
     * Pass any additional props directly to the footer Text component.
     */
    FooterTextProps?: TextProps;
    /**
     * Custom footer component.
     * Overrides all other `footer*` props.
     */
    FooterComponent?: ReactElement;
}
/**
 * Cards are useful for displaying related information in a contained way.
 * If a ListItem displays content horizontally, a Card can be used to display content vertically.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Card/}
 * @param {CardProps} props - The props for the `Card` component.
 * @returns {JSX.Element} The rendered `Card` component.
 */
export declare function Card(props: CardProps): import('react').JSX.Element;
export {};
