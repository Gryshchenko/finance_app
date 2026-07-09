import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';

// Visible height of the blur strip above the home-indicator area. The scrolling
// content is padded by this much at the bottom so the last row can clear it.
export const BLUR_FOOTER_HEIGHT = 15;

/**
 * A contentless translucent blur strip pinned to the bottom of the screen - the
 * bottom counterpart to the blur header. The list scrolls underneath it and dissolves
 * into the blur via a smooth gradient (no hard divider line). Non-interactive, so
 * scroll gestures pass straight through.
 */
export const BlurFooter: React.FC = () => {
    const { themeContext, theme } = useAppTheme();
    const { colors } = theme;
    const { bottom } = useSafeAreaInsets();

    // Fade from fully transparent at the top to the solid app background at the bottom,
    // so content melts into the screen edge instead of ending on a line. `${bg}00` is
    // the same colour at zero alpha, which keeps the fade neutral (no grey tint).
    const gradient = `linear-gradient(to top, ${colors.background} 0%, ${colors.background}00 100%)`;

    return (
        <View pointerEvents="none" style={[$footer, { height: BLUR_FOOTER_HEIGHT + bottom, bottom: -bottom }]}>
            <BlurView intensity={25} tint={themeContext === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { experimental_backgroundImage: gradient }]} />
        </View>
    );
};

// Full-bleed: negative horizontal insets cancel the screen container's padding so the
// blur reaches both edges. Negative bottom extends it under the home indicator.
const $footer: ViewStyle = {
    position: 'absolute',
    left: -spacing.lg,
    right: -spacing.lg,
    zIndex: 10,
    overflow: 'hidden',
};
