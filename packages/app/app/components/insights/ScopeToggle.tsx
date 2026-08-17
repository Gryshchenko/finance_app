import { FC, useState } from 'react';
import { LayoutChangeEvent, Pressable, TextStyle, View, ViewStyle } from 'react-native';
import { StatsScope } from '@tenpercent/shared';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';
import { ThemedStyle } from '@/theme/types';

/** The two scopes this screen offers; `StatsScope.All` is not a user-facing choice. */
export type InsightsScope = StatsScope.Own | StatsScope.Shared;

const SCOPES: InsightsScope[] = [StatsScope.Own, StatsScope.Shared];

const TRACK_PADDING = 3;

const COMPACT_WIDTH = 260;

interface IProps {
    scope: InsightsScope;
    onChange: (scope: InsightsScope) => void;
    /** Member count of the shared group - shown as a badge on the Shared side. */
    memberCount: number;
}

export const ScopeToggle: FC<IProps> = ({ scope, onChange, memberCount }) => {
    const { themed } = useAppTheme();
    const [trackWidth, setTrackWidth] = useState(0);

    const innerWidth = Math.max(trackWidth - TRACK_PADDING * 2, 0);
    const segmentWidth = innerWidth / SCOPES.length;
    const compact = innerWidth > 0 && innerWidth < COMPACT_WIDTH;
    const activeIndex = SCOPES.indexOf(scope);

    const handleLayout = (event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width);

    const $animatedThumb = useAnimatedStyle(() => ({
        width: segmentWidth,
        transform: [{ translateX: withTiming(activeIndex * segmentWidth, { duration: 180 }) }],
    }));

    return (
        <View style={themed($track)} onLayout={handleLayout}>
            {segmentWidth > 0 && <Animated.View style={[themed($thumb), $animatedThumb]} />}

            {SCOPES.map((option) => {
                const isActive = option === scope;
                return (
                    <Pressable
                        key={option}
                        style={themed($segment)}
                        onPress={() => onChange(option)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                    >
                        <Text
                            tx={option === StatsScope.Own ? 'insights:scopeMine' : 'insights:scopeShared'}
                            numberOfLines={1}
                            style={[themed($label), compact && $labelCompact, isActive && themed($labelActive)]}
                        />
                        {option === StatsScope.Shared && (
                            <View style={[themed($badge), isActive && themed($badgeActive)]}>
                                <Text
                                    text={String(memberCount)}
                                    style={[themed($badgeText), isActive && themed($badgeTextActive)]}
                                />
                            </View>
                        )}
                    </Pressable>
                );
            })}
        </View>
    );
};

const $track: ThemedStyle<ViewStyle> = ({ colors }) => ({
    width: '100%',
    flexDirection: 'row',
    padding: TRACK_PADDING,
    borderRadius: 40,
    backgroundColor: colors.segmented.track,
});

const $thumb: ThemedStyle<ViewStyle> = ({ colors }) => ({
    position: 'absolute',
    top: TRACK_PADDING,
    left: TRACK_PADDING,
    bottom: TRACK_PADDING,
    borderRadius: 40,
    backgroundColor: colors.segmented.thumb,
    shadowColor: colors.segmented.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
});

const $segment: ThemedStyle<ViewStyle> = () => ({
    flex: 1,
    minWidth: 0,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs + 3,
    paddingHorizontal: spacing.xs,
});

const $label: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    flexShrink: 1,
    fontFamily: typography.primary.normal,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textDim,
});

const $labelCompact: TextStyle = {
    fontSize: 12,
    lineHeight: 16,
};

const $labelActive: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontFamily: typography.primary.semiBold,
    color: colors.text,
});

const $badge: ThemedStyle<ViewStyle> = ({ colors }) => ({
    paddingHorizontal: spacing.xs - 1,
    paddingVertical: 1,
    borderRadius: 40,
    backgroundColor: colors.surfaceMuted,
});

const $badgeActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
    backgroundColor: colors.tint,
});

const $badgeText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontFamily: typography.fonts.funnelSans.bold,
    fontSize: 10,
    lineHeight: 14,
    color: colors.textDim,
});

const $badgeTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
    color: colors.palette.neutral100,
});
