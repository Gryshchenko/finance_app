import { FC } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';
import { IShareGroup } from '@tenpercent/shared';

import { GeneralDetailView } from '@/components/GeneralDetailView';
import { GroupSelectDropdown } from '@/components/sharing/GroupSelectDropdown';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { TxKeyPath } from '@/i18n';
import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';
import { ThemedStyle } from '@/theme/types';

export interface InviteUserForm {
    email?: string;
    userGroupId?: number;
}

interface IProps {
    form: Partial<InviteUserForm>;
    errors?: Partial<Record<keyof InviteUserForm, TxKeyPath>>;
    handleChange?: (key: keyof InviteUserForm, value: string | number) => void;
    handleSave?: () => void;
    onCancel?: () => void;
    isSaveDisabled?: boolean;
}

export const InviteUserFields: FC<IProps> = function InviteUserFields(_props) {
    const { form, errors, handleChange, handleSave, onCancel, isSaveDisabled } = _props;
    const { themed } = useAppTheme();

    return (
        <GeneralDetailView
            isCreate
            isEdit={false}
            isView={false}
            onSave={handleSave}
            onCancel={onCancel}
            isSaveDisabled={isSaveDisabled}
            createTx={'sharing:sendInvite'}
        >
            <View style={$wrapper}>
                <Text tx={'sharing:inviteCaption'} style={themed($caption)} />

                <TextField
                    preset={'default'}
                    focusOnMount
                    labelTx={'sharing:emailLabel'}
                    placeholderTx={'sharing:emailPlaceholder'}
                    autoCapitalize={'none'}
                    keyboardType={'email-address'}
                    autoComplete={'email'}
                    value={form.email ?? ''}
                    helperTx={errors?.email}
                    status={errors?.email ? 'error' : undefined}
                    onChangeText={(v) => handleChange?.('email', v)}
                />

                <GroupSelectDropdown
                    preset={'default'}
                    value={form.userGroupId}
                    helperTx={errors?.userGroupId}
                    status={errors?.userGroupId ? 'error' : undefined}
                    onChange={(group: IShareGroup) => handleChange?.('userGroupId', group.userGroupId)}
                />
            </View>
        </GeneralDetailView>
    );
};

const $wrapper: ViewStyle = {
    paddingHorizontal: spacing.xs,
};

const $caption: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 15,
    lineHeight: 22,
    color: colors.textDim,
    fontFamily: typography.primary.normal,
    marginBottom: spacing.lg,
});
