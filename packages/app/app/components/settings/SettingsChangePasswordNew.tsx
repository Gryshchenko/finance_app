import { ComponentType, FC, useEffect, useMemo, useState } from 'react';
import { View, ViewStyle, TextStyle } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';

import { Button } from '@/components/buttons/Button';
import { PressableIcon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { TextField, type TextFieldAccessoryProps } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { useEditView } from '@/hooks/useEditView';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath } from '@/navigators/SettingsStackNavigator';
import { settingsChangePasswordNewSchema } from '@/schems/validationSchemas';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { ChangePasswordService } from '@/services/ChangePasswordService';
import ToastService from '@/services/ToastService';
import { colors } from '@/theme/colors';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { OverviewPath } from '@/types/OverviewPath';

interface Form {
    newPassword: string;
    repeatPassword: string;
}

/**
 * Last step of the password change: the new password is typed here and sent together with the
 * code that was verified on the previous screen. Until this call succeeds the account still
 * holds its old password, so leaving the screen costs the user nothing but the code.
 */
export const SettingsChangePasswordNew: FC = function SettingsChangePasswordNew() {
    const { themed } = useAppTheme();
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    const { doSessionEnded } = useAuth();
    const [isNewPasswordHidden, setIsNewPasswordHidden] = useState<boolean>(true);
    const [isRepeatPasswordHidden, setIsRepeatPasswordHidden] = useState<boolean>(true);
    const { form, handleChange, save, errors, setErrors, withFetching, isFetching } = useEditView<Partial<Form>>(
        { newPassword: '', repeatPassword: '' },
        settingsChangePasswordNewSchema,
    );

    useEffect(() => {
        // The code lives in memory only, so an app the system killed while the user was reading
        // their mail arrives here with nothing to send. Say so and start over rather than
        // failing on submit.
        if (!ChangePasswordService.instance().hasVerifiedCode()) {
            ToastService.error({ title: 'common:error', message: 'settingsChangePasswordNewScreen:codeLost' });
            navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.ChangePassword });
        }
    }, [navigation]);

    const apply = async () => {
        await withFetching(async () => {
            const response = await ChangePasswordService.instance().apply(form.newPassword!);
            if (response.kind === GeneralApiProblemKind.Ok) {
                // Toast first: it is mounted next to the navigator, not inside it, so it
                // survives the stack swap on the next line.
                ToastService.success({ title: 'common:success', message: 'settingsChangePasswordNewScreen:successMessage' });
                // Every session died with the change, this one included. Flipping auth state
                // re-renders AppStack onto the login screens - there is nothing to navigate to
                // by hand, because the authenticated screens stop existing.
                await doSessionEnded();
            } else if (response.kind === GeneralApiProblemKind.BadData) {
                handleBadDataResponse(response.errors, setErrors);
            } else {
                buildGeneralApiBaseHandler(response);
            }
        });
    };

    const handleSave = async () => {
        const isValid = await save();
        if (!isValid) return;
        await apply();
    };

    const NewPasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
        () =>
            function NewPasswordRightAccessory(props: TextFieldAccessoryProps) {
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
        [isNewPasswordHidden],
    );

    const RepeatPasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
        () =>
            function RepeatPasswordRightAccessory(props: TextFieldAccessoryProps) {
                return (
                    <PressableIcon
                        icon={isRepeatPasswordHidden ? 'view' : 'hidden'}
                        color={colors.textDim}
                        containerStyle={props.style}
                        size={20}
                        onPress={() => setIsRepeatPasswordHidden(!isRepeatPasswordHidden)}
                    />
                );
            },
        [isRepeatPasswordHidden],
    );

    return (
        <View style={$container}>
            <Text tx="settingsChangePasswordNewScreen:description" style={themed($description)} />
            <TextField
                preset={'underline'}
                focusOnMount={true}
                labelTx={'settingsChangePasswordNewScreen:newPassword'}
                placeholderTx="common:passwordNewFieldPlaceholder"
                value={form.newPassword ?? ''}
                helperTx={errors?.newPassword}
                status={errors?.newPassword ? 'error' : undefined}
                secureTextEntry={isNewPasswordHidden}
                onChangeText={(v) => handleChange('newPassword', v)}
                RightAccessory={NewPasswordRightAccessory}
            />
            <TextField
                preset={'underline'}
                labelTx={'settingsChangePasswordNewScreen:repeatPassword'}
                placeholderTx="common:passwordNewFieldPlaceholder"
                value={form.repeatPassword ?? ''}
                helperTx={errors?.repeatPassword}
                status={errors?.repeatPassword ? 'error' : undefined}
                secureTextEntry={isRepeatPasswordHidden}
                onChangeText={(v) => handleChange('repeatPassword', v)}
                RightAccessory={RepeatPasswordRightAccessory}
            />
            <View style={$spacer} />
            <Button
                tx="settingsChangePasswordNewScreen:saveButton"
                style={themed($tapButton)}
                preset={'reversed'}
                disabled={isFetching}
                onPress={handleSave}
            />
            <Button
                tx="common:back"
                style={themed($tapButton)}
                preset={'reversed'}
                onPress={() => {
                    navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.ChangePasswordConfirm });
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

const $tapButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    marginTop: spacing.xs,
});

const $description: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
    fontSize: 14,
    fontFamily: typography.primary.medium,
    color: colors.textDim,
    lineHeight: 20,
    marginBottom: spacing.lg,
});
