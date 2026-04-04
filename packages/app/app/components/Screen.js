import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import { SystemBars } from 'react-native-edge-to-edge';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { useAppTheme } from '@/theme/context';
import { $styles } from '@/theme/styles';
import { useSafeAreaInsetsStyle } from '@/utils/useSafeAreaInsetsStyle';

export const DEFAULT_BOTTOM_OFFSET = 50;
const isIos = Platform.OS === 'ios';
/**
 * @param {ScreenPreset?} preset - The preset to check.
 * @returns {boolean} - Whether the preset is non-scrolling.
 */
function isNonScrolling(preset) {
    return !preset || preset === 'fixed';
}
/**
 * Custom hook that handles the automatic enabling/disabling of scroll ability based on the content size and screen size.
 * @param {UseAutoPresetProps} props - The props for the `useAutoPreset` hook.
 * @returns {{boolean, Function, Function}} - The scroll state, and the `onContentSizeChange` and `onLayout` functions.
 */
function useAutoPreset(props) {
    const { preset, scrollEnabledToggleThreshold } = props;
    const { percent = 0.92, point = 0 } = scrollEnabledToggleThreshold || {};
    const scrollViewHeight = useRef(null);
    const scrollViewContentHeight = useRef(null);
    const [scrollEnabled, setScrollEnabled] = useState(true);
    function updateScrollState() {
        if (scrollViewHeight.current === null || scrollViewContentHeight.current === null) return;
        // check whether content fits the screen then toggle scroll state according to it
        const contentFitsScreen = (function () {
            if (point) {
                return scrollViewContentHeight.current < scrollViewHeight.current - point;
            } else {
                return scrollViewContentHeight.current < scrollViewHeight.current * percent;
            }
        })();
        // content is less than the size of the screen, so we can disable scrolling
        if (scrollEnabled && contentFitsScreen) setScrollEnabled(false);
        // content is greater than the size of the screen, so let's enable scrolling
        if (!scrollEnabled && !contentFitsScreen) setScrollEnabled(true);
    }
    /**
     * @param {number} w - The width of the content.
     * @param {number} h - The height of the content.
     */
    function onContentSizeChange(w, h) {
        // update scroll-view content height
        scrollViewContentHeight.current = h;
        updateScrollState();
    }
    /**
     * @param {LayoutChangeEvent} e = The layout change event.
     */
    function onLayout(e) {
        const { height } = e.nativeEvent.layout;
        // update scroll-view  height
        scrollViewHeight.current = height;
        updateScrollState();
    }
    // update scroll state on every render
    if (preset === 'auto') updateScrollState();
    return {
        scrollEnabled: preset === 'auto' ? scrollEnabled : true,
        onContentSizeChange,
        onLayout,
    };
}
/**
 * @param {ScreenProps} props - The props for the `ScreenWithoutScrolling` component.
 * @returns {JSX.Element} - The rendered `ScreenWithoutScrolling` component.
 */
function ScreenWithoutScrolling(props) {
    const { style, contentContainerStyle, children, preset } = props;
    return (
        <View style={[$outerStyle, style]}>
            <View style={[$innerStyle, preset === 'fixed' && $justifyFlexEnd, contentContainerStyle]}>{children}</View>
        </View>
    );
}
/**
 * @param {ScreenProps} props - The props for the `ScreenWithScrolling` component.
 * @returns {JSX.Element} - The rendered `ScreenWithScrolling` component.
 */
function ScreenWithScrolling(props) {
    const {
        children,
        keyboardShouldPersistTaps = 'handled',
        keyboardBottomOffset = DEFAULT_BOTTOM_OFFSET,
        contentContainerStyle,
        ScrollViewProps,
        style,
    } = props;
    const ref = useRef(null);
    const { scrollEnabled, onContentSizeChange, onLayout } = useAutoPreset(props);
    // Add native behavior of pressing the active tab to scroll to the top of the content
    // More info at: https://reactnavigation.org/docs/use-scroll-to-top/
    useScrollToTop(ref);
    return (
        <KeyboardAwareScrollView
            bottomOffset={keyboardBottomOffset}
            {...{ keyboardShouldPersistTaps, scrollEnabled, ref }}
            {...ScrollViewProps}
            onLayout={(e) => {
                onLayout(e);
                ScrollViewProps?.onLayout?.(e);
            }}
            onContentSizeChange={(w, h) => {
                onContentSizeChange(w, h);
                ScrollViewProps?.onContentSizeChange?.(w, h);
            }}
            style={[$outerStyle, ScrollViewProps?.style, style]}
            contentContainerStyle={[$innerStyle, ScrollViewProps?.contentContainerStyle, contentContainerStyle]}
        >
            {children}
        </KeyboardAwareScrollView>
    );
}
/**
 * Represents a screen component that provides a consistent layout and behavior for different screen presets.
 * The `Screen` component can be used with different presets such as "fixed", "scroll", or "auto".
 * It handles safe area insets, status bar settings, keyboard avoiding behavior, and scrollability based on the preset.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Screen/}
 * @param {ScreenProps} props - The props for the `Screen` component.
 * @returns {JSX.Element} The rendered `Screen` component.
 */
export function Screen(props) {
    const {
        theme: { colors },
        themeContext,
    } = useAppTheme();
    const {
        backgroundColor,
        KeyboardAvoidingViewProps,
        keyboardOffset = 0,
        safeAreaEdges,
        SystemBarsProps,
        systemBarStyle,
    } = props;
    const $containerInsets = useSafeAreaInsetsStyle(safeAreaEdges);
    return (
        <View style={[$containerStyle, { backgroundColor: backgroundColor || colors.background }, $containerInsets]}>
            <SystemBars style={systemBarStyle || (themeContext === 'dark' ? 'light' : 'dark')} {...SystemBarsProps} />

            <KeyboardAvoidingView
                behavior={isIos ? 'padding' : 'height'}
                keyboardVerticalOffset={keyboardOffset}
                {...KeyboardAvoidingViewProps}
                style={[$styles.flex1, KeyboardAvoidingViewProps?.style]}
            >
                {isNonScrolling(props.preset) ? <ScreenWithoutScrolling {...props} /> : <ScreenWithScrolling {...props} />}
            </KeyboardAvoidingView>
        </View>
    );
}
const $containerStyle = {
    flex: 1,
    height: '100%',
    width: '100%',
};
const $outerStyle = {
    flex: 1,
    height: '100%',
    width: '100%',
};
const $justifyFlexEnd = {
    justifyContent: 'flex-end',
};
const $innerStyle = {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
};
