import { FC } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';
import { IConnectedMember } from '@tenpercent/shared';

import { GeneralDetailView } from '@/components/GeneralDetailView';
import { MembersCard } from '@/components/sharing/MembersCard';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { TxKeyPath } from '@/i18n';
import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';
import { ThemedStyle } from '@/theme/types';

export interface GroupForm {
    groupName?: string;
    description?: string;
}

interface IProps {
    form: GroupForm;
    errors?: Partial<Record<keyof GroupForm, TxKeyPath>>;
    isCreate: boolean;
    members?: IConnectedMember[];
    onPressMember?: (connectionId: number) => void;
    handleChange?: (key: keyof GroupForm, value: string) => void;
    handleSave?: () => void;
    onCancel?: () => void;
    isSaveDisabled?: boolean;
}

export const GroupFields: FC<IProps> = function GroupFields(_props) {
    const { form, errors, isCreate, members, onPressMember, handleChange, handleSave, onCancel, isSaveDisabled } = _props;
    const { themed } = useAppTheme();

    return (
        <GeneralDetailView
            isCreate={isCreate}
            isEdit={!isCreate}
            isView={false}
            onSave={handleSave}
            onCancel={onCancel}
            isSaveDisabled={isSaveDisabled}
            createTx={'sharing:saveGroup'}
        >
            <View style={$wrapper}>
                <TextField
                    preset={'default'}
                    focusOnMount={isCreate}
                    labelTx={'sharing:groupNameLabel'}
                    placeholderTx={'sharing:groupNamePlaceholder'}
                    value={form.groupName ?? ''}
                    helperTx={errors?.groupName}
                    status={errors?.groupName ? 'error' : undefined}
                    onChangeText={(v) => handleChange?.('groupName', v)}
                />

                <TextField
                    preset={'default'}
                    labelTx={'sharing:descriptionLabel'}
                    placeholderTx={'sharing:descriptionPlaceholder'}
                    multiline
                    value={form.description ?? ''}
                    helperTx={errors?.description}
                    status={errors?.description ? 'error' : undefined}
                    containerStyle={$descriptionContainer}
                    style={$descriptionInput}
                    inputWrapperStyle={$descriptionWrapper}
                    onChangeText={(v) => handleChange?.('description', v)}
                />

                {!isCreate && (
                    <View style={$members}>
                        <Text tx={'sharing:groupMembers'} style={themed($sectionTitle)} />
                        {members?.length ? (
                            <MembersCard data={members} onPressMember={onPressMember} />
                        ) : (
                            <Text tx={'sharing:groupMembersEmpty'} style={themed($membersEmpty)} />
                        )}
                    </View>
                )}
            </View>
        </GeneralDetailView>
    );
};

const $wrapper: ViewStyle = {
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
};

const $descriptionContainer: ViewStyle = {
    height: 130,
};

const $descriptionWrapper: ViewStyle = {
    height: 110,
    alignItems: 'flex-start',
};

const $descriptionInput: TextStyle = {
    height: 110,
    textAlignVertical: 'top',
    paddingTop: 12,
};

const $members: ViewStyle = {
    marginTop: spacing.lg,
};

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.textDim,
    fontFamily: typography.primary.medium,
    marginBottom: spacing.xs,
});

const $membersEmpty: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 13,
    color: colors.textDim,
    fontFamily: typography.primary.normal,
});
