import { FC } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';
import { IConnectedMember, IShareGroup } from '@tenpercent/shared';

import { Avatar } from '@/components/Avatar';
import { GeneralDetailView } from '@/components/GeneralDetailView';
import { GroupSelectDropdown } from '@/components/sharing/GroupSelectDropdown';
import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';
import { ThemedStyle } from '@/theme/types';

export interface MemberForm {
    userGroupId: number | undefined;
}

interface IProps {
    user: IConnectedMember;
    form: MemberForm;
    handleChange?: (field: keyof MemberForm, value: any) => void;
    handleSave?: () => void;
    isSaveDisabled?: boolean;
}

export const MemberFields: FC<IProps> = function MemberFields(_props) {
    const { user, form, handleChange, handleSave, isSaveDisabled } = _props;
    const { themed } = useAppTheme();

    return (
        <GeneralDetailView isCreate={false} isEdit isView={false} onSave={handleSave} isSaveDisabled={isSaveDisabled}>
            <View style={$wrapper}>
                <View style={themed($header)}>
                    <Avatar name={(user.publicName || user.email) ?? 'unknown'} size={64} />
                    <View style={$headerText}>
                        <Text text={user.publicName || user.email} style={themed($name)} />
                        <Text text={user.email} style={themed($email)} />
                    </View>
                </View>
                <View style={$section}>
                    <Text tx={'sharing:access'} style={themed($sectionTitle)} />
                    <GroupSelectDropdown
                        preset={'default'}
                        labelTx={'sharing:groupLabel'}
                        value={form.userGroupId}
                        onChange={(group: IShareGroup) => handleChange?.('userGroupId', group.userGroupId)}
                    />
                </View>
            </View>
        </GeneralDetailView>
    );
};

const $wrapper: ViewStyle = {
    paddingHorizontal: spacing.xs,
};

const $header: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
});

const $headerText: ViewStyle = {
    flex: 1,
};

const $name: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 20,
    color: colors.text,
    fontFamily: typography.primary.semiBold,
});

const $email: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 14,
    color: colors.textDim,
    fontFamily: typography.primary.normal,
    marginTop: 2,
});

const $section: ViewStyle = {
    marginTop: spacing.xl,
};

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.textDim,
    fontFamily: typography.primary.medium,
    marginBottom: spacing.sm,
});
