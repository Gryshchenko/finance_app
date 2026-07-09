import { LayoutChangeEvent, Pressable, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { IProfileClient } from 'tenpercent/shared';

import { ProfileAvatar } from '@/components/Avatar';
import { useDragOverlay } from '@/components/dashboard/Box/DragOverlayContext';
import { Text } from '@/components/Text';
import { useAppQuery } from '@/hooks/useAppQuery';
import { fetchProfile } from '@/hooks/useSettingsProfile';
import { TxKeyPath } from '@/i18n/index';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';
import { ThemedStyle } from '@/theme/types';
import { OverviewPath } from '@/types/OverviewPath';

// Distance (px) over which the header morphs from opaque to translucent-blur as the
// list scrolls underneath it - mirrors the iOS large-title nav bar transition.
const SCROLL_FADE_DISTANCE = 40;

interface Props {
    tx: TxKeyPath;
    /**
     * Reports the measured overlay height (header row + any children) so the scrolling
     * content beneath it can be padded down by exactly this much - nothing hidden behind
     * the overlay at rest.
     */
    onHeightChange?: (height: number) => void;
    /**
     * Extra content pinned under the header row inside the same blur overlay (e.g. the
     * balance summary). Scrolls stay behind it just like behind the header row itself.
     */
    children?: React.ReactNode;
}

export const HeaderV2: React.FC<Props> = ({ tx, onHeightChange, children }) => {
    const { themed, theme, themeContext } = useAppTheme();
    const { colors } = theme;
    const navigation = useNavigation();
    const { scrollY } = useDragOverlay();

    const { data: profile } = useAppQuery<IProfileClient | undefined>(QueryKeys.profile(), fetchProfile, {
        staleTime: QueryStaleTimes.detail,
    });

    const avatarSeed = profile?.publicName || profile?.email || 'Clara Barton';

    const onLayout = (e: LayoutChangeEvent) => {
        onHeightChange?.(e.nativeEvent.layout.height);
    };

    // At the top the header is a solid opaque bar; as content scrolls under it the
    // solid layer fades out and the blur + hairline separator fade in.
    const $solidStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [0, SCROLL_FADE_DISTANCE], [1, 0], Extrapolation.CLAMP),
    }));
    const $blurStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [0, SCROLL_FADE_DISTANCE], [0, 1], Extrapolation.CLAMP),
    }));
    const $borderStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [0, SCROLL_FADE_DISTANCE], [0, 1], Extrapolation.CLAMP),
    }));

    return (
        <View style={themed($overlay)} onLayout={onLayout}>
            {/* Full-bleed background layers, cross-fading on scroll. */}
            <Animated.View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }, $solidStyle]}
            />
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, $blurStyle]}>
                <BlurView intensity={40} tint={themeContext === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            </Animated.View>
            <Animated.View pointerEvents="none" style={[themed($border), $borderStyle]} />

            <View style={themed($container)}>
                <View style={themed($left)}>
                    <View style={themed($avatarWrapper)}>
                        <ProfileAvatar avatar={profile?.avatar} name={avatarSeed} size={40} />
                        <View style={themed($onlineDot)} />
                    </View>

                    <View>
                        <Text tx={tx} style={themed($subtitle)}></Text>
                    </View>
                </View>

                <Pressable
                    onPress={() => navigation.getParent()?.navigate(OverviewPath.Settings)}
                    style={themed($notificationButton)}
                >
                    <MaterialIcons name="menu" size={20} color={colors.text} />
                </Pressable>
            </View>

            {children ? <View style={themed($childrenWrap)}>{children}</View> : null}
        </View>
    );
};

// Absolutely positioned over the list. Negative insets cancel the screen container's
// padding so the blur reaches the very edges / top, while the inner content keeps the
// standard horizontal gutter via $container's paddingHorizontal.
export const $overlay: ThemedStyle<ViewStyle> = () => ({
    position: 'absolute',
    top: -spacing.lg,
    left: -spacing.lg,
    right: -spacing.lg,
    zIndex: 10,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    overflow: 'hidden',
});

// Restores the standard horizontal gutter for pinned children, since the overlay
// itself is full-bleed (negative horizontal insets).
export const $childrenWrap: ThemedStyle<ViewStyle> = () => ({
    paddingHorizontal: spacing.lg,
});

export const $border: ThemedStyle<ViewStyle> = ({ colors }) => ({
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
});

export const $avatarWrapper: ThemedStyle<ViewStyle> = () => ({
    position: 'relative',
});

export const $onlineDot: ThemedStyle<ViewStyle> = ({ colors }) => ({
    position: 'absolute',
    right: -2,
    bottom: -2,

    width: 10,
    height: 10,
    borderRadius: 5,

    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
});
export const $container: ThemedStyle<ViewStyle> = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: 10,
});

export const $left: ThemedStyle<ViewStyle> = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
});

export const $subtitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.textDim,
    fontWeight: '500',
    fontFamily: typography.fonts.funnelSans.medium,
});

export const $notificationButton: ThemedStyle<ViewStyle> = () => ({
    width: 40,
    height: 40,

    alignItems: 'center',
    justifyContent: 'center',
});
