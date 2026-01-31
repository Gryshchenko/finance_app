import { useState, useEffect, useCallback } from 'react';
import { View, Pressable, Animated, LayoutChangeEvent, TextStyle, ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

type SwitcherOption = {
    id: string | number;
    label: string;
    value: unknown;
};

type IgniteSwitcherProps = {
    disabled?: boolean;
    options: SwitcherOption[];
    value?: unknown;
    onChange?: (item: SwitcherOption) => void;
    style?: Record<string, unknown>;
};

export default function IgniteSwitcher({ options, value, onChange, style, disabled }: IgniteSwitcherProps) {
    const [selected, setSelected] = useState(options.find((opt) => opt.value === value) || options[0]);
    const [width, setWidth] = useState(0);
    const [indicator] = useState(new Animated.Value(0));
    const { themed } = useAppTheme();

    const animate = useCallback(
        (index: number) => {
            Animated.spring(indicator, {
                toValue: index,
                useNativeDriver: true,
                speed: 20,
                bounciness: 6,
            }).start();
        },
        [indicator],
    );

    useEffect(() => {
        options.map((option, index) => {
            if (option.value === value) {
                animate(index);
            }
        });
    }, [animate, options, value]);

    const handleLayout = (e: LayoutChangeEvent) => {
        setWidth(e.nativeEvent.layout.width);
    };

    const handlePress = (opt: SwitcherOption, index: number) => {
        if (disabled) return;
        setSelected(opt);
        if (onChange) onChange(opt);
        animate(index);
    };

    const segmentWidth = width / options.length;
    const translateX = indicator.interpolate({
        inputRange: [0, options.length - 1],
        outputRange: [0, (options.length - 1) * segmentWidth],
    });

    return (
        <View style={[themed($container), style]} onLayout={handleLayout}>
            <View style={themed($track)}>
                {width > 0 && (
                    <Animated.View
                        style={[
                            themed($indicator),
                            {
                                width: segmentWidth - 4,
                                transform: [{ translateX }],
                            },
                        ]}
                    />
                )}

                {options.map((opt, idx) => {
                    const isActive = selected.value === opt.value;
                    return (
                        <Pressable
                            disabled={disabled}
                            key={opt.id}
                            style={themed($segment)}
                            onPress={() => handlePress(opt, idx)}
                        >
                            <Text style={[themed($label), isActive && themed($labelActive)]}>{opt.label}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const $container: ViewStyle = {
    width: '100%',
};

const $track: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.xxs,
    backgroundColor: colors.background,
    overflow: 'hidden',
    position: 'relative',
});

const $segment: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    flex: 1,
});

const $label: ThemedStyle<TextStyle> = ({ colors }) => ({
    fontSize: 15,
    color: colors.text,
});

const $labelActive: ThemedStyle<TextStyle> = ({ colors }) => ({
    color: colors.tint,
});

const $indicator: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
    position: 'absolute',
    backgroundColor: colors.background,
    borderRadius: spacing.xxs,
    top: 2,
    left: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    height: '90%',
    boxShadow: 'rgba(0, 0, 0, 0.5) 0px 0px 6px',
});
