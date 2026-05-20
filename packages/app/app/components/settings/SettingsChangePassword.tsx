import { ComponentType, FC, useMemo, useState } from 'react';
import { View, ViewStyle, TextStyle } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';

import { EditButtons } from '@/components/buttons/EditButtons';
import { PressableIcon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { TextField, type TextFieldAccessoryProps } from '@/components/TextField';
import { useEditView } from '@/hooks/useEditView';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath } from '@/navigators/SettingsStackNavigator';
import { settingsChangePasswordSchema } from '@/schems/validationSchemas';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { ChangePasswordService } from '@/services/ChangePasswordService';
import { colors } from '@/theme/colors';
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
    const [isPasswordHidden, setIsPasswordHidden] = useState<boolean>(true);
    const [isNewPasswordHidden, setIsNewPasswordHidden] = useState<boolean>(true);
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
            handleBadDataResponse(response.errors, setErrors);
        } else {
            buildGeneralApiBaseHandler(response);
        }
    };

    const handleSave = async () => {
        const isValid = await save();
        if (!isValid) return;
        await handlePatch();
    };

    const PasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
        () =>
            function PasswordRightAccessory(props: TextFieldAccessoryProps) {
                return (
                    <PressableIcon
                        icon={isPasswordHidden ? 'view' : 'hidden'}
                        color={colors.textDim}
                        containerStyle={props.style}
                        size={20}
                        onPress={() => setIsPasswordHidden(!isPasswordHidden)}
                    />
                );
            },
        [isPasswordHidden, colors.textDim],
    );
    const PasswordRightAccessoryRepeat: ComponentType<TextFieldAccessoryProps> = useMemo(
        () =>
            function PasswordRightAccessory(props: TextFieldAccessoryProps) {
                return (
                    <PressableIcon
                        icon={isNewPasswordHidden ? 'view' : 'hidden'}
                        color={colors.textDim}
                        containerStyle={props.style}
                        size={20}
                        onPress={() => setIsNewPasswordHidden(!isNewPasswordHidden)}
                    />
                );
            },
        [isNewPasswordHidden, colors.textDim],
    );
    return (
        <View style={$container}>
            <Text tx="settingsChangePasswordScreen:description" style={themed($description)} />
            <TextField
                preset={'underline'}
                focusOnMount={true}
                labelTx={'settingsChangePasswordScreen:currentPassword'}
                placeholderTx="common:passwordFieldPlaceholder"
                value={form.password ?? ''}
                helperTx={errors?.password}
                status={errors?.password ? 'error' : undefined}
                secureTextEntry={isPasswordHidden}
                onChangeText={(v) => handleChange('password', v)}
                RightAccessory={PasswordRightAccessory}
            />
            <TextField
                preset={'underline'}
                labelTx={'settingsChangePasswordScreen:newPassword'}
                placeholderTx="common:passwordNewFieldPlaceholder"
                value={form.newPassword ?? ''}
                helperTx={errors?.newPassword}
                status={errors?.newPassword ? 'error' : undefined}
                secureTextEntry={isNewPasswordHidden}
                onChangeText={(v) => handleChange('newPassword', v)}
                RightAccessory={PasswordRightAccessoryRepeat}
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
