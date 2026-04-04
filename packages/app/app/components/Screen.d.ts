import { ReactNode } from 'react';
import { KeyboardAvoidingViewProps, ScrollViewProps, StyleProp, ViewStyle } from 'react-native';
import { SystemBarsProps, SystemBarStyle } from 'react-native-edge-to-edge';

import { ExtendedEdge } from '@/utils/useSafeAreaInsetsStyle';

export declare const DEFAULT_BOTTOM_OFFSET = 50;
interface BaseScreenProps {
    /**
     * Children components.
     */
    children?: ReactNode;
    /**
     * Style for the outer content container useful for padding & margin.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * Style for the inner content container useful for padding & margin.
     */
    contentContainerStyle?: StyleProp<ViewStyle>;
    /**
     * Override the default edges for the safe area.
     */
    safeAreaEdges?: ExtendedEdge[];
    /**
     * Background color
     */
    backgroundColor?: string;
    /**
     * System bar setting. Defaults to dark.
     */
    systemBarStyle?: SystemBarStyle;
    /**
     * By how much should we offset the keyboard? Defaults to 0.
     */
    keyboardOffset?: number;
    /**
     * By how much we scroll up when the keyboard is shown. Defaults to 50.
     */
    keyboardBottomOffset?: number;
    /**
     * Pass any additional props directly to the SystemBars component.
     */
    SystemBarsProps?: SystemBarsProps;
    /**
     * Pass any additional props directly to the KeyboardAvoidingView component.
     */
    KeyboardAvoidingViewProps?: KeyboardAvoidingViewProps;
}
interface FixedScreenProps extends BaseScreenProps {
    preset?: 'fixed';
}
interface ScrollScreenProps extends BaseScreenProps {
    preset?: 'scroll';
    /**
     * Should keyboard persist on screen tap. Defaults to handled.
     * Only applies to scroll preset.
     */
    keyboardShouldPersistTaps?: 'handled' | 'always' | 'never';
    /**
     * Pass any additional props directly to the ScrollView component.
     */
    ScrollViewProps?: ScrollViewProps;
}
interface AutoScreenProps extends Omit<ScrollScreenProps, 'preset'> {
    preset?: 'auto';
    /**
     * Threshold to trigger the automatic disabling/enabling of scroll ability.
     * Defaults to `{ percent: 0.92 }`.
     */
    scrollEnabledToggleThreshold?: {
        percent?: number;
        point?: number;
    };
}
export type ScreenProps = ScrollScreenProps | FixedScreenProps | AutoScreenProps;
/**
 * Represents a screen component that provides a consistent layout and behavior for different screen presets.
 * The `Screen` component can be used with different presets such as "fixed", "scroll", or "auto".
 * It handles safe area insets, status bar settings, keyboard avoiding behavior, and scrollability based on the preset.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Screen/}
 * @param {ScreenProps} props - The props for the `Screen` component.
 * @returns {JSX.Element} The rendered `Screen` component.
 */
export declare function Screen(props: ScreenProps): import('react').JSX.Element;
export {};
