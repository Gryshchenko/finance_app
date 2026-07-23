import { useEffect, useState } from 'react';
import { Pressable, TextStyle, View, ViewStyle } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import Svg, { Path } from 'react-native-svg';

import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/buttons/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useAppQuery } from '@/hooks/useAppQuery';
import { TxKeyPath } from '@/i18n';
import { translate } from '@/i18n/translate';
import { fetchSelectedGoals, GoalService } from '@/services/GoalService';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';
import { ThemedStyle } from '@/theme/types';

const GOALS: { id: string; titleTx: TxKeyPath }[] = [
    { id: 'save', titleTx: 'signUpGoalsScreen:goals.save' },
    { id: 'spend', titleTx: 'signUpGoalsScreen:goals.spend' },
    { id: 'budget', titleTx: 'signUpGoalsScreen:goals.budget' },
    { id: 'together', titleTx: 'signUpGoalsScreen:goals.together' },
    { id: 'grow', titleTx: 'signUpGoalsScreen:goals.grow' },
];

export type GoalId = (typeof GOALS)[number]['id'];

interface Props {
    onDone: (goals: GoalId[]) => void;
    onBack?: () => void;
}

export function SignUpGoalsScreen({ onDone, onBack }: Props) {
    const { themed } = useAppTheme();
    const queryClient = useQueryClient();
    const [sel, setSel] = useState<Record<string, boolean>>({});
    const count = Object.values(sel).filter(Boolean).length;

    // Prefill with the previously saved selection (empty for a fresh sign-up).
    const { data: savedGoals } = useAppQuery<string[]>(QueryKeys.selectedGoals(), fetchSelectedGoals, {
        staleTime: QueryStaleTimes.detail,
    });
    useEffect(() => {
        if (!savedGoals?.length) return;
        // Don't clobber choices the user already made while the query was loading.
        setSel((prev) => (Object.keys(prev).length ? prev : Object.fromEntries(savedGoals.map((id) => [id, true]))));
    }, [savedGoals]);

    const toggle = (id: GoalId) => setSel((s) => ({ ...s, [id]: !s[id] }));

    const finish = () => {
        const goals = GOALS.filter((g) => sel[g.id]).map((g) => g.id);
        GoalService.instance().doPostGoals(goals);
        queryClient.setQueryData(QueryKeys.selectedGoals(), goals);
        onDone(goals);
    };

    const countLabel =
        count === 0
            ? translate('signUpGoalsScreen:selectAtLeastOne')
            : count === 1
              ? translate('signUpGoalsScreen:selectedOne')
              : translate('signUpGoalsScreen:selectedCount', { total: count });

    return (
        <Screen preset="fixed" contentContainerStyle={themed($screen)} safeAreaEdges={['top', 'bottom']}>
            {!!onBack && (
                <View style={$backRow}>
                    <BackButton onPress={onBack} />
                </View>
            )}
            <View style={$header}>
                <Text tx="signUpGoalsScreen:kicker" style={themed($kicker)} />
                <Text tx="signUpGoalsScreen:title" style={themed($title)} />
                <Text tx="signUpGoalsScreen:body" style={themed($body)} />
            </View>

            <View style={$list}>
                {GOALS.map((g) => {
                    const on = !!sel[g.id];
                    return (
                        <Pressable key={g.id} onPress={() => toggle(g.id)} style={themed($row)}>
                            <Text tx={g.titleTx} style={[themed($rowText), on && themed($rowTextOn)]} />
                            <View style={[themed($checkbox), on && themed($checkboxOn)]}>
                                {on && (
                                    <Svg width={14} height={14} viewBox="0 0 14 14">
                                        <Path
                                            d="M2 7.5L5.5 11L12 3"
                                            fill="none"
                                            stroke="#FFFFFF"
                                            strokeWidth={2.4}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </Svg>
                                )}
                            </View>
                        </Pressable>
                    );
                })}
            </View>

            <View style={$footer}>
                <Text text={countLabel} style={themed($countLabel)} />
                <Button preset="reversed" tx="signUpGoalsScreen:continue" disabled={count === 0} style={$cta} onPress={finish} />
            </View>
        </Screen>
    );
}

const $screen: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
});
const $backRow: ViewStyle = { alignItems: 'flex-start', marginTop: spacing.xs };
const $header: ViewStyle = { gap: spacing.xs, marginTop: spacing.lg, marginBottom: spacing.lg };
const $kicker: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.tint,
    fontFamily: typography.primary.medium,
});
const $title: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 26,
    lineHeight: 31,
    color: colors.text,
    fontFamily: typography.primary.semiBold,
});
const $body: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 15,
    lineHeight: 22,
    color: colors.textDim,
    fontFamily: typography.primary.normal,
});
const $list: ViewStyle = { flex: 1, gap: 4 };
const $row: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxs,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
});
const $rowText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    flex: 1,
    fontSize: 16,
    color: colors.textDim,
    fontFamily: typography.primary.medium,
});
const $rowTextOn: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.text });
const $checkbox: ThemedStyle<ViewStyle> = ({ colors }) => ({
    width: 24,
    height: 24,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: colors.palette.neutral400,
    backgroundColor: colors.palette.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
});
const $checkboxOn: ThemedStyle<ViewStyle> = ({ colors }) => ({ borderColor: colors.tint, backgroundColor: colors.tint });
const $footer: ViewStyle = { gap: spacing.sm, alignItems: 'center', paddingTop: spacing.md };
const $countLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 13,
    color: colors.textDim,
    fontFamily: typography.primary.normal,
});
const $cta: ViewStyle = { width: '100%' };
