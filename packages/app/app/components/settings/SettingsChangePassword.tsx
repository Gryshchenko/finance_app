import { FC } from 'react';
import { View, ViewStyle, TextStyle } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';

import { EditButtons } from '@/components/buttons/EditButtons';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { useEditView } from '@/hooks/useEditView';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath } from '@/navigators/SettingsStackNavigator';
import { settingsChangePasswordSchema } from '@/schems/validationSchemas';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, parseServerErrors } from '@/services/api/apiProblem';
import { ChangePasswordService } from '@/services/ChangePasswordService';
import ToastService from '@/services/ToastService';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { OverviewPath } from '@/types/OverviewPath';

interface Form {
    password: string;
    newPassword: string;
}

export const SettingsChangePassword: FC = function SettingsChangePassword() {
    const { themed } = useAppTheme();
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    const { form, handleChange, save, errors, setErrors } = useEditView<Partial<Form>>(
        { password: '', newPassword: '' },
        settingsChangePasswordSchema,
    );

    const handlePatch = async () => {
        const changePasswordService = ChangePasswordService.instance();

        const response = await changePasswordService.request(form.newPassword!, form.password!);
        if (response.kind === GeneralApiProblemKind.Ok) {
            navigation.navigate(OverviewPath.Settings, {
                screen: SettingsPath.ChangePasswordConfirm,
            });
        } else if (response.kind === GeneralApiProblemKind.BadData) {
            const { fieldErrors, hasNonFieldErrors } = parseServerErrors(response.errors);
            if (Object.keys(fieldErrors).length > 0) {
                setErrors(fieldErrors as any);
            }
            if (hasNonFieldErrors) {
                ToastService.error({ title: 'common:error', message: 'settingsChangePasswordScreen:updateFailed' });
            }
        } else {
            buildGeneralApiBaseHandler(response);
        }
    };

    const handleSave = async () => {
        const isValid = await save();
        if (!isValid) return;
        await handlePatch();
    };

    return (
        <View style={$container}>
            <Text tx="settingsChangePasswordScreen:description" style={themed($description)} />
            <TextField
                preset={'underline'}
                focusOnMount={true}
                labelTx={'settingsChangePasswordScreen:currentPassword'}
                value={form.password ?? ''}
                helperTx={errors?.password}
                status={errors?.password ? 'error' : undefined}
                secureTextEntry
                onChangeText={(v) => handleChange('password', v)}
            />
            <TextField
                preset={'underline'}
                labelTx={'settingsChangePasswordScreen:newPassword'}
                value={form.newPassword ?? ''}
                helperTx={errors?.newPassword}
                status={errors?.newPassword ? 'error' : undefined}
                secureTextEntry
                onChangeText={(v) => handleChange('newPassword', v)}
            />
            <View style={$spacer} />
            <EditButtons
                isCreate={false}
                isView={false}
                onSave={handleSave}
                onCancel={() => {
                    navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.Settings });
                }}
            />
        </View>
    );
};

const $container: ViewStyle = {
    flex: 1,
};

const $spacer: ViewStyle = {
    flex: 1,
};

const $description: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
    fontSize: 14,
    fontFamily: typography.primary.medium,
    color: colors.textDim,
    lineHeight: 20,
    marginBottom: spacing.lg,
});
