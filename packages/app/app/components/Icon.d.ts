import { ImageStyle, StyleProp, TouchableOpacityProps, ViewProps, ViewStyle } from 'react-native';

export type IconTypes = keyof typeof iconRegistry;
interface BaseIconProps {
    /**
     * The name of the icon
     */
    icon: IconTypes;
    /**
     * An optional tint color for the icon
     */
    color?: string;
    /**
     * An optional size for the icon. If not provided, the icon will be sized to the icon's resolution.
     */
    size?: number;
    /**
     * Style overrides for the icon image
     */
    style?: StyleProp<ImageStyle>;
    /**
     * Style overrides for the icon container
     */
    containerStyle?: StyleProp<ViewStyle>;
}
type PressableIconProps = Omit<TouchableOpacityProps, 'style'> & BaseIconProps;
type IconProps = Omit<ViewProps, 'style'> & BaseIconProps;
/**
 * A component to render a registered icon.
 * It is wrapped in a <TouchableOpacity />
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Icon/}
 * @param {PressableIconProps} props - The props for the `PressableIcon` component.
 * @returns {JSX.Element} The rendered `PressableIcon` component.
 */
export declare function PressableIcon(props: PressableIconProps): import('react').JSX.Element;
/**
 * A component to render a registered icon.
 * It is wrapped in a <View />, use `PressableIcon` if you want to react to input
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Icon/}
 * @param {IconProps} props - The props for the `Icon` component.
 * @returns {JSX.Element} The rendered `Icon` component.
 */
export declare function Icon(props: IconProps): import('react').JSX.Element;
export declare const iconRegistry: {
    add: any;
    back: any;
    bell: any;
    caretLeft: any;
    caretRight: any;
    check: any;
    clap: any;
    community: any;
    components: any;
    debug: any;
    github: any;
    heart: any;
    hidden: any;
    ladybug: any;
    lock: any;
    menu: any;
    more: any;
    pin: any;
    podcast: any;
    settings: any;
    slack: any;
    view: any;
    edit: any;
    x: any;
};
export {};
