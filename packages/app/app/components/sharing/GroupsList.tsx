import { FC } from 'react';
import { Pressable, ScrollView, TextStyle, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { IShareGroup } from '@tenpercent/shared';

import { EmptyState } from '@/components/EmptyState';
import { Text } from '@/components/Text';
import { translate } from '@/i18n/translate';
import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';
import { $styles } from '@/theme/styles';
import { ThemedStyle } from '@/theme/types';

interface IProps {
    data: IShareGroup[] | undefined;
    onPressGroup?: (userGroupId: number) => void;
}

export const GroupsList: FC<IProps> = function GroupsList({ data, onPressGroup }) {
    const { themed } = useAppTheme();

    if (!data?.length) {
        return <EmptyState headingTx={'sharing:groupsTitle'} contentTx={'sharing:groupsEmpty'} style={containerStyleOverride} />;
    }

    return (
        <ScrollView style={$styles.flex1} contentContainerStyle={$content}>
            <Text tx={'sharing:groupsCaption'} style={themed($caption)} />
            <View style={themed($card)}>
                {data.map((group, index) => (
                    <GroupRow
                        key={group.userGroupId}
                        group={group}
                        isLast={index === data.length - 1}
                        onPress={() => onPressGroup?.(group.userGroupId)}
                    />
                ))}
            </View>
        </ScrollView>
    );
};

const GroupRow: FC<{ group: IShareGroup; isLast: boolean; onPress: () => void }> = ({ group, isLast, onPress }) => {
    const {
        themed,
        theme: { colors },
    } = useAppTheme();
    const memberCount = group.memberCount ?? 0;
    const membersLabel = `${memberCount} ${translate(memberCount === 1 ? 'sharing:member' : 'sharing:members')}`;
    return (
        <Pressable onPress={onPress} style={[themed($row), !isLast && themed($rowBorder)]}>
            <View style={$rowText}>
                <View style={$nameRow}>
                    <Text text={group.groupName} style={themed($name)} numberOfLines={1} />
                    <Text text={membersLabel} style={themed($count)} />
                </View>
                {!!group.description && <Text text={group.description} style={themed($description)} numberOfLines={1} />}
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textDim} />
        </Pressable>
    );
};

const $content: ViewStyle = {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
};

const $caption: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 14,
    color: colors.textDim,
    fontFamily: typography.primary.normal,
    marginBottom: spacing.md,
});

const $card: ThemedStyle<ViewStyle> = ({ colors }) => ({
    backgroundColor: colors.palette.neutral100,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
});

const $row: ThemedStyle<ViewStyle> = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
});

const $rowBorder: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
});

const $rowText: ViewStyle = {
    flex: 1,
};

const $nameRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
};

const $name: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 16,
    color: colors.text,
    fontFamily: typography.primary.semiBold,
    flexShrink: 1,
});

const $count: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 12,
    color: colors.textDim,
    fontFamily: typography.primary.normal,
});

const $description: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 13,
    color: colors.textDim,
    fontFamily: typography.primary.normal,
    marginTop: 2,
});
const containerStyleOverride: ViewStyle = {
    margin: 'auto',
};
