import { TextStyle, ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import type { ThemedStyle, ThemedStyleArray } from '@/theme/types';

/**
 * Shared preset type used by TextField, FieldModal, Dropdown, IgniteDatePicker
 * and every other form-level input component so they all look consistent.
 */
export type FieldPresets = 'default' | 'underline' | 'filled' | 'compact' | 'underlineBig';

export interface FieldPresetStyleMap {
    /** Outer container (controls overall height) */
    container: ThemedStyleArray<ViewStyle>;
    /** Wrapper around the input / trigger (border, background, shadow) */
    inputWrapper: ThemedStyleArray<ViewStyle>;
    /** The actual TextInput or trigger-text styles */
    input: ThemedStyleArray<TextStyle>;
    /** Label above the field */
    label: ThemedStyleArray<TextStyle>;
}

// ---------------------------------------------------------------------------
// Base (default preset)
// ---------------------------------------------------------------------------

const $baseContainer: ThemedStyle<ViewStyle> = () => ({
    height: 110,
});

const $baseLabel: ThemedStyle<TextStyle> = ({ spacing, typography }) => ({
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: spacing.xxxs,
    marginLeft: 4,
    textTransform: 'uppercase',
    color: colors.textDim,
    fontFamily: typography.fonts.funnelSans.semiBold,
});

const $baseInput: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    flex: 1,
    alignSelf: 'stretch',
    fontFamily: typography.primary.normal,
    fontSize: 14,
    height: 54,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textDim,
    width: '80%',
});

const $baseInputWrapper: ThemedStyle<ViewStyle> = ({ colors, border }) => ({
    alignItems: 'flex-start',
    borderWidth: border.borderWidth,
    backgroundColor: colors.palette.neutral100,
    borderRadius: border.borderRadius,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 1,
    height: 54,
});
// ---------------------------------------------------------------------------
// Underline Big
// ---------------------------------------------------------------------------

const $underlineBigContainer: ThemedStyle<ViewStyle> = () => ({
    height: 170,
});

const $underlineBigInputWrapper: ThemedStyle<ViewStyle> = ({ colors }) => ({
    alignItems: 'flex-start',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    overflow: 'hidden',
});

const $underlineBigInput: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    flex: 1,
    alignSelf: 'stretch',
    fontFamily: typography.primary.semiBold,
    height: 120,
    fontSize: 52,
    paddingHorizontal: 4,
    paddingVertical: 10,
    color: colors.text,
    width: '80%',
    textAlign: 'center',
});

const $underlineBigLabel: ThemedStyle<TextStyle> = ({ spacing, typography }) => ({
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: spacing.xxxs,
    marginLeft: 4,
    textTransform: 'uppercase',
    color: colors.textDim,
    fontFamily: typography.fonts.funnelSans.semiBold,
});

// ---------------------------------------------------------------------------
// Underline
// ---------------------------------------------------------------------------

const $underlineContainer: ThemedStyle<ViewStyle> = () => ({
    height: 80,
});

const $underlineInputWrapper: ThemedStyle<ViewStyle> = ({ colors }) => ({
    alignItems: 'flex-start',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    height: 38,
});

const $underlineInput: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    flex: 1,
    alignSelf: 'stretch',
    fontFamily: typography.primary.bold,
    fontSize: 14,
    paddingHorizontal: 4,
    paddingVertical: 10,
    color: colors.text,
    width: '80%',
});

// ---------------------------------------------------------------------------
// Filled
// ---------------------------------------------------------------------------

const $filledInputWrapper: ThemedStyle<ViewStyle> = ({ colors, border }) => ({
    alignItems: 'flex-start',
    borderWidth: 0,
    backgroundColor: colors.palette.neutral200,
    borderRadius: border.borderRadius,
    overflow: 'hidden',
    height: 54,
});

// ---------------------------------------------------------------------------
// Compact
// ---------------------------------------------------------------------------

const $compactContainer: ThemedStyle<ViewStyle> = () => ({
    height: 64,
});

const $compactInput: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    flex: 1,
    alignSelf: 'stretch',
    fontFamily: typography.primary.normal,
    fontSize: 13,
    height: 38,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.textDim,
    width: '80%',
});

const $compactLabel: ThemedStyle<TextStyle> = ({ spacing, typography }) => ({
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: spacing.xxxs,
    marginLeft: 4,
    textTransform: 'uppercase',
    color: colors.textDim,
    fontFamily: typography.fonts.funnelSans.semiBold,
});

// ---------------------------------------------------------------------------
// Presets record
// ---------------------------------------------------------------------------

export const $fieldPresets: Record<FieldPresets, FieldPresetStyleMap> = {
    default: {
        container: [$baseContainer],
        inputWrapper: [$baseInputWrapper],
        input: [$baseInput],
        label: [$baseLabel],
    },
    underline: {
        container: [$underlineContainer],
        inputWrapper: [$underlineInputWrapper],
        input: [$underlineInput],
        label: [$baseLabel],
    },
    underlineBig: {
        container: [$underlineBigContainer],
        inputWrapper: [$underlineBigInputWrapper],
        input: [$underlineBigInput],
        label: [$underlineBigLabel],
    },
    filled: {
        container: [$baseContainer],
        inputWrapper: [$filledInputWrapper],
        input: [$baseInput],
        label: [$baseLabel],
    },
    compact: {
        container: [$compactContainer],
        inputWrapper: [$baseInputWrapper],
        input: [$compactInput],
        label: [$compactLabel],
    },
};

// ---------------------------------------------------------------------------
// Shared focus / state styles (used by TextField, FieldModal, etc.)
// ---------------------------------------------------------------------------

export const $labelNotSelectedStyle: ThemedStyle<TextStyle> = () => ({
    color: colors.textDim,
});

export const $labelSelectedStyle: ThemedStyle<TextStyle> = () => ({
    color: colors.text,
});

export const $borderFocusStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderColor: colors.tint,
});

export const $borderNoFocusStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderColor: colors.border,
});

export const $helperStyle: ThemedStyle<TextStyle> = ({ spacing }) => ({
    marginTop: spacing.xxxs,
    fontSize: 10,
    lineHeight: 16,
});
