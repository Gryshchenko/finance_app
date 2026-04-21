import { ErrorInfo } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { typography } from '@/theme/typography';

export interface ErrorDetailsProps {
    error: Error;
    errorInfo: ErrorInfo | null;
    onReset(): void;
    onGoBack?: () => void;
}

export function ErrorDetails(props: ErrorDetailsProps) {
    const {
        themed,
        theme: { colors },
    } = useAppTheme();

    return (
        <Screen preset="fixed" safeAreaEdges={['top', 'bottom']} contentContainerStyle={themed($contentContainer)}>
            <View style={themed($iconContainer)}>
                <Icon icon="ladybug" size={64} color={colors.palette.neutral900} />
            </View>

            <Text style={themed($heading)} tx="errorScreen:title" />
            <Text style={themed($subtitle)} tx="errorScreen:friendlySubtitle" />

            <View style={$buttonStack}>
                <Button preset="reversed" style={themed($primaryButton)} onPress={props.onReset} tx="errorScreen:reset" />
                {props.onGoBack && (
                    <Button preset="default" style={themed($secondaryButton)} onPress={props.onGoBack} tx="errorScreen:goBack" />
                )}
            </View>
        </Screen>
    );
}

const $contentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
});

const $iconContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
    borderWidth: 1,
    borderColor: colors.palette.grey300,
    backgroundColor: colors.palette.grey200,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
});

const $heading: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
    fontFamily: typography.fonts.funnelSans.medium,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    color: colors.palette.neutral900,
    textAlign: 'center',
    marginBottom: spacing.xs,
});

const $subtitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
    fontFamily: typography.primary.normal,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: colors.textDim,
    textAlign: 'center',
    letterSpacing: 0.3,
    maxWidth: 280,
    marginBottom: spacing.lg,
});

const $buttonStack: ViewStyle = {
    width: '100%',
    gap: 8,
};

const $primaryButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
    width: '100%',
    borderRadius: 0,
    backgroundColor: colors.palette.neutral900,
    paddingVertical: 16,
});

const $secondaryButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
    width: '100%',
    borderRadius: 0,
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.palette.grey300,
    paddingVertical: 16,
});
