import { Image, ImageStyle, StyleProp, TouchableOpacity, TouchableOpacityProps, View, ViewProps, ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/context';

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
export function PressableIcon(props: PressableIconProps) {
    const { icon, color, size, style: $imageStyleOverride, containerStyle: $containerStyleOverride, ...pressableProps } = props;

    const { theme } = useAppTheme();

    const $imageStyle: StyleProp<ImageStyle> = [
        $imageStyleBase,
        { tintColor: color ?? theme.colors.text },
        size !== undefined && { width: size, height: size },
        $imageStyleOverride,
    ];

    return (
        <TouchableOpacity {...pressableProps} style={$containerStyleOverride}>
            <Image style={$imageStyle} source={iconRegistry[icon]} />
        </TouchableOpacity>
    );
}

/**
 * A component to render a registered icon.
 * It is wrapped in a <View />, use `PressableIcon` if you want to react to input
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Icon/}
 * @param {IconProps} props - The props for the `Icon` component.
 * @returns {JSX.Element} The rendered `Icon` component.
 */
export function Icon(props: IconProps) {
    const { icon, color, size, style: $imageStyleOverride, containerStyle: $containerStyleOverride, ...viewProps } = props;

    const { theme } = useAppTheme();

    const $imageStyle: StyleProp<ImageStyle> = [
        $imageStyleBase,
        { tintColor: color ?? theme.colors.text },
        size !== undefined && { width: size, height: size },
        $imageStyleOverride,
    ];

    return (
        <View {...viewProps} style={$containerStyleOverride}>
            <Image style={$imageStyle} source={iconRegistry[icon]} />
        </View>
    );
}

export const iconRegistry = {
    'back': require('@assets/icons/back.png'),
    'bell': require('@assets/icons/bell.png'),
    'caretLeft': require('@assets/icons/caretLeft.png'),
    'caretRight': require('@assets/icons/caretRight.png'),
    'check': require('@assets/icons/check.png'),
    'hidden': require('@assets/icons/hidden.png'),
    'ladybug': require('@assets/icons/ladybug.png'),
    'lock': require('@assets/icons/lock.png'),
    'menu': require('@assets/icons/menu.png'),
    'more': require('@assets/icons/more.png'),
    'settings': require('@assets/icons/settings.png'),
    'view': require('@assets/icons/view.png'),
    'edit': require('@assets/icons/edit.png'),
    'x': require('@assets/icons/x.png'),
    'add': require('@assets/icons/categories/add-line.png'),
    'trash': require('@assets/icons/trash.png'),

    // ───── General / Finance
    '24-hours': require('@assets/icons/categories/24-hours-line.png'),
    'award': require('@assets/icons/categories/award-line.png'),
    'percent': require('@assets/icons/categories/percent-line.png'),
    'trophy': require('@assets/icons/categories/trophy-line.png'),

    // ───── Accounts / Money
    'wallet': require('@assets/icons/categories/wallet-line.png'),
    'wallet2': require('@assets/icons/categories/wallet-2-line.png'),
    'wallet3': require('@assets/icons/categories/wallet-3-line.png'),
    'bankCard': require('@assets/icons/categories/bank-card-line.png'),
    'bankCard2': require('@assets/icons/categories/bank-card-2-line.png'),
    'cash': require('@assets/icons/categories/cash-line.png'),
    'coin': require('@assets/icons/categories/coin-line.png'),
    'copperCoin': require('@assets/icons/categories/copper-coin-line.png'),
    'handCoin': require('@assets/icons/categories/hand-coin-line.png'),
    'funds': require('@assets/icons/categories/funds-line.png'),
    'fundsBox': require('@assets/icons/categories/funds-box-line.png'),
    'safe': require('@assets/icons/categories/safe-line.png'),
    'safe2': require('@assets/icons/categories/safe-2-line.png'),

    // ───── Crypto / Exchange
    'bnb': require('@assets/icons/categories/bnb-line.png'),
    'exchange': require('@assets/icons/categories/exchange-line.png'),
    'exchangeBox': require('@assets/icons/categories/exchange-box-line.png'),
    'exchangeFunds': require('@assets/icons/categories/exchange-funds-line.png'),
    'p2p': require('@assets/icons/categories/p2p-line.png'),

    // ───── Shopping / Spend
    'shoppingBag': require('@assets/icons/categories/shopping-bag-line.png'),
    'shoppingBag2': require('@assets/icons/categories/shopping-bag-2-line.png'),
    'shoppingBag3': require('@assets/icons/categories/shopping-bag-3-line.png'),
    'shoppingBag4': require('@assets/icons/categories/shopping-bag-4-line.png'),
    'shoppingBasket': require('@assets/icons/categories/shopping-basket-line.png'),
    'shoppingCart': require('@assets/icons/categories/shopping-cart-line.png'),
    'coupon': require('@assets/icons/categories/coupon-line.png'),
    'discount': require('@assets/icons/categories/discount-percent-line.png'),
    'priceTag': require('@assets/icons/categories/price-tag-line.png'),
    'priceTag2': require('@assets/icons/categories/price-tag-2-line.png'),
    'refund': require('@assets/icons/categories/refund-line.png'),
    'refund2': require('@assets/icons/categories/refund-2-line.png'),
    'store': require('@assets/icons/categories/store-line.png'),
    'store2': require('@assets/icons/categories/store-2-line.png'),
    'gift': require('@assets/icons/categories/gift-line.png'),

    // ───── Transport / Travel
    'bus': require('@assets/icons/categories/bus-line.png'),
    'train': require('@assets/icons/categories/train-line.png'),
    'plane': require('@assets/icons/categories/plane-line.png'),
    'hotel': require('@assets/icons/categories/hotel-line.png'),
    'ticket': require('@assets/icons/categories/ticket-line.png'),
    'ticket2': require('@assets/icons/categories/ticket-2-line.png'),

    // ───── Food / Leisure
    'restaurant': require('@assets/icons/categories/restaurant-line.png'),
    'restaurant2': require('@assets/icons/categories/restaurant-2-line.png'),
    'drinks': require('@assets/icons/categories/drinks-line.png'),
    'dice': require('@assets/icons/categories/dice-6-line.png'),
    'gamepad': require('@assets/icons/categories/gamepad-line.png'),
    'baseball': require('@assets/icons/categories/baseball-line.png'),
    'piano': require('@assets/icons/categories/piano-grand-line.png'),
    'tv': require('@assets/icons/categories/tv-line.png'),
    'mv': require('@assets/icons/categories/mv-line.png'),

    // ───── Health / Services
    'hospital': require('@assets/icons/categories/hospital-line.png'),
    'syringe': require('@assets/icons/categories/syringe-line.png'),
    'capsule': require('@assets/icons/categories/capsule-line.png'),
    'service': require('@assets/icons/categories/service-line.png'),

    // ───── Communication / Tech
    'phone': require('@assets/icons/categories/cellphone-line.png'),
    'mail': require('@assets/icons/categories/mail-line.png'),
    'cloud': require('@assets/icons/categories/cloud-line.png'),
    'videoChat': require('@assets/icons/categories/video-chat-line.png'),

    // ───── VIP / Status
    'vip': require('@assets/icons/categories/vip-line.png'),
    'vipCrown': require('@assets/icons/categories/vip-crown-line.png'),
    'vipCrown2': require('@assets/icons/categories/vip-crown-2-line.png'),
    'vipDiamond': require('@assets/icons/categories/vip-diamond-line.png'),
};

const $imageStyleBase: ImageStyle = {
    resizeMode: 'contain',
};
