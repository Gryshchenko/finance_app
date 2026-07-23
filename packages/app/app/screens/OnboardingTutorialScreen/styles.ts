import { ImageStyle, TextStyle, ViewStyle } from 'react-native';

import { spacing } from '@/theme/spacing';
import { ThemedStyle } from '@/theme/types';

// Palette values pulled from theme/colors.ts + services/ColorService.ts so the
// previews match the real dashboard boxes exactly.
export const ACCOUNT_COLORS = { navy: '#2C3E50', teal: '#16A085', green: '#27AE60', blue: '#2E86C1' };

export const $screen: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    justifyContent: 'space-between',
});
export const $skipRow: ViewStyle = { minHeight: 24, alignItems: 'flex-end' };
export const $skip: ThemedStyle<TextStyle> = ({ colors }) => ({ fontSize: 14, color: colors.textDim });
export const $center: ViewStyle = { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg };
export const $stage: ViewStyle = { height: 300, width: '100%', alignItems: 'center', justifyContent: 'center' };
export const $copy: ViewStyle = { alignItems: 'center', gap: spacing.sm, maxWidth: 310 };
export const $logo: ImageStyle = { width: 220, height: 220 };

export const $kicker: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.tint,
    fontFamily: typography.primary.medium,
});
export const $title: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 24,
    lineHeight: 29,
    textAlign: 'center',
    color: colors.text,
    fontFamily: typography.primary.semiBold,
});
export const $body: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.textDim,
    fontFamily: typography.primary.normal,
});

export const $footer: ViewStyle = { gap: spacing.lg, alignItems: 'center' };
export const $dots: ViewStyle = { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' };
export const $dot: ThemedStyle<ViewStyle> = ({ colors }) => ({
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.palette.neutral300,
});
export const $dotActive: ThemedStyle<ViewStyle> = ({ colors }) => ({ width: 20, backgroundColor: colors.tint });
export const $buttons: ViewStyle = { flexDirection: 'row', gap: spacing.sm, width: '100%' };
export const $back: ViewStyle = { flex: 1 };
export const $next: ViewStyle = { flex: 2 };

// Box + chip (dashboard box vocabulary)
export const $chip: ViewStyle = { width: 62, alignItems: 'center', gap: 6 };
export const $box: ViewStyle = { width: 56, height: 56, borderRadius: 2, alignItems: 'center', justifyContent: 'center' };
export const $boxFill: ViewStyle = {
    ...({ position: 'absolute' } as ViewStyle),
    width: 56,
    height: 56,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
};
export const $boxShadow: ViewStyle = {
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
};
export const $boxShadowStrong: ViewStyle = {
    shadowColor: 'rgba(25,16,21,0.25)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 2,
};
export const $boxWhite: ThemedStyle<ViewStyle> = ({ colors }) => ({
    backgroundColor: colors.palette.neutral100,
    borderWidth: 1,
    borderColor: colors.border,
});
export const $boxDashed: ThemedStyle<ViewStyle> = ({ colors }) => ({
    backgroundColor: colors.background,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.palette.neutral400,
});
export const $boxLetter: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontFamily: typography.fonts.funnelSans.bold,
    fontSize: 22,
    color: colors.palette.neutral100,
});
export const $chipTitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontFamily: typography.fonts.funnelSans.bold,
    fontSize: 12,
    color: colors.text,
});
export const $chipValue: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontFamily: typography.fonts.funnelSans.bold,
    fontSize: 10,
    color: colors.textDim,
    marginTop: -4,
});
export const $rowGap: ViewStyle = { flexDirection: 'row', gap: spacing.lg };
export const $flex1: ViewStyle = { flex: 1 };
export const $previewWide: ViewStyle = { width: 310, gap: spacing.lg };
export const $absoluteIcon: ImageStyle = { position: 'absolute' };

// Dashboard balance
export const $balanceRow: ViewStyle = { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' };
export const $balanceStats: ViewStyle = { flexDirection: 'row', gap: spacing.lg, marginBottom: 4 };
export const $statCol: ViewStyle = { alignItems: 'flex-end' };
export const $baseline: ViewStyle = { flexDirection: 'row', alignItems: 'baseline' };
export const $eyebrow: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textDim,
    fontFamily: typography.fonts.funnelSans.medium,
    marginBottom: 4,
});
export const $eyebrowSm: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.textDim,
    fontFamily: typography.fonts.funnelSans.medium,
    marginBottom: 3,
});
export const $totalValue: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontFamily: typography.fonts.funnelSans.bold,
    fontSize: 30,
    letterSpacing: -0.5,
    color: colors.text,
});
export const $totalDecimals: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontFamily: typography.fonts.funnelSans.bold,
    fontSize: 20,
    color: colors.textDim,
    marginLeft: 2,
});
export const $stat: ThemedStyle<TextStyle> = ({ typography }) => ({
    fontFamily: typography.fonts.funnelSans.medium,
    fontSize: 14,
});

// Insights cards
export const $insightsWrap: ViewStyle = { width: 300, gap: spacing.sm };
export const $metricRow: ViewStyle = { flexDirection: 'row', gap: spacing.sm };
export const $metricCard: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flex: 1,
    height: 96,
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.palette.neutral100,
    borderWidth: 1,
    borderColor: colors.border,
});
export const $metricLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 11,
    color: colors.textDim,
    fontFamily: typography.primary.normal,
    marginBottom: 2,
});
export const $metricValue: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 17,
    color: colors.text,
    fontFamily: typography.fonts.funnelSans.medium,
});
export const $trendCard: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.palette.neutral100,
    borderWidth: 1,
    borderColor: colors.border,
});
export const $trendTitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 15,
    color: colors.text,
    fontFamily: typography.primary.semiBold,
    marginTop: 4,
});
export const $trendBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
});
export const $trendArrow: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.palette.green400, fontSize: 15 });

// List cards (income / sharing)
export const $listCard: ThemedStyle<ViewStyle> = ({ colors }) => ({
    width: 300,
    backgroundColor: colors.palette.neutral100,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
});
export const $listRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
};
export const $rowBorder: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
});
export const $avatarSq: ViewStyle = { width: 40, height: 40, borderRadius: 2, alignItems: 'center', justifyContent: 'center' };
export const $rowTitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 15,
    color: colors.text,
    fontFamily: typography.primary.normal,
});
export const $rowTitleBold: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 15,
    color: colors.text,
    fontFamily: typography.primary.semiBold,
});
export const $rowSub: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 12,
    color: colors.textDim,
    fontFamily: typography.primary.normal,
});
export const $incomeAmount: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 15,
    color: colors.palette.green400,
    fontFamily: typography.fonts.funnelSans.medium,
});
export const $spread: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
};
export const $chevron: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim, fontSize: 18 });

// Categories drag-and-drop demo
export const $targetHighlight: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderRadius: 2,
    backgroundColor: colors.palette.grey300,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.palette.grey400,
});
export const $ghostBox: ViewStyle = { position: 'absolute', top: 0, left: 3, backgroundColor: ACCOUNT_COLORS.navy };
