import { FC } from 'react';
import { Pressable, TextStyle, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { IConnectedMember } from '@tenpercent/shared';

import { Avatar } from '@/components/Avatar';
import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';
import { ThemedStyle } from '@/theme/types';

interface MembersCardProps {
    data: IConnectedMember[];
    onPressMember?: (connectionId: number) => void;
}

export const MembersCard: FC<MembersCardProps> = function MembersCard({ data, onPressMember }) {
    const { themed } = useAppTheme();
    return (
        <View style={themed($card)}>
            {data.map((member, index) => (
                <MemberRow
                    key={member.connectionId}
                    member={member}
                    isLast={index === data.length - 1}
                    onPress={() => onPressMember?.(member.connectionId)}
                />
            ))}
        </View>
    );
};

const MemberRow: FC<{ member: IConnectedMember; isLast: boolean; onPress: () => void }> = ({ member, isLast, onPress }) => {
    const {
        themed,
        theme: { colors },
    } = useAppTheme();
    return (
        <Pressable onPress={onPress} style={[themed($row), !isLast && themed($rowBorder)]}>
            <Avatar name={member.publicName || member.email} size={44} />
            <View style={$rowText}>
                <Text text={member.publicName || member.email} style={themed($name)} numberOfLines={1} />
                <Text text={member.email} style={themed($email)} numberOfLines={1} />
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textDim} />
        </Pressable>
    );
};

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

const $name: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 16,
    color: colors.text,
    fontFamily: typography.primary.semiBold,
    flexShrink: 1,
});

const $email: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 13,
    color: colors.textDim,
    fontFamily: typography.primary.normal,
    marginTop: 2,
});
