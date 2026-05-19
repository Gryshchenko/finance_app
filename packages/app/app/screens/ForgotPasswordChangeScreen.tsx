import { ComponentType, FC, useMemo, useState } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { TextButton } from '@/components/buttons/TextButton';
import { HeaderTitle } from '@/components/HeaderTitle';
import { PressableIcon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField, type TextFieldAccessoryProps } from '@/components/TextField';
import { useEditView } from '@/hooks/useEditView';
import type { AppStackScreenProps } from '@/navigators/AppNavigator';
import { forgotPasswordChangeSchema } from '@/schems/validationSchemas';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { ForgotPasswordService } from '@/services/ForgotPasswordService';
import ToastService from '@/services/ToastService';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { AppPath } from '@/types/AppPath';

interface Props extends AppStackScreenProps<AppPath.ForgotPasswordChange> {}

export const ForgotPasswordChangeScreen: FC<Props> = (_props) => {
    const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState<boolean>(true);
    const [isRepeatPasswordHidden, setIsRepeatPasswordHidden] = useState<boolean>(true);
    const { navigation } = _props;

    const { form, handleChange, save, errors, setErrors } = useEditView<{
        newPassword: string;
        repeatPassword: string;
    }>({ newPassword: '', repeatPassword: '' }, forgotPasswordChangeSchema);

    const {
        themed,
        theme: { colors },
    } = useAppTheme();

    function goBack() {
        navigation.navigate({ name: AppPath.Login, params: undefined });
    }

    async function request() {
        const isValid = await save();
        if (!isValid) return;
        const forgetPasswordService = ForgotPasswordService.instance();

        const response = await forgetPasswordService.change(form?.newPassword!);

        if (response.kind === GeneralApiProblemKind.Ok) {
            handleChange('repeatPassword', '');
            handleChange('newPassword', '');
            navigation.navigate({ name: AppPath.Login, params: undefined });
        } else if (response.kind === GeneralApiProblemKind.BadData) {
            handleBadDataResponse(response.errors, setErrors, new Set(['newPassword']));
        } else {
            buildGeneralApiBaseHandler(response);
            ToastService.error({ message: 'forgotPasswordScreen:sessionExpired' });
            navigation.navigate({ name: AppPath.ForgotPasswordRequest, params: undefined });
        }
    }

    const PasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
        () =>
            function PasswordRightAccessory(props: TextFieldAccessoryProps) {
                return (
                    <PressableIcon
                        icon={isAuthPasswordHidden ? 'view' : 'hidden'}
                        color={colors.textDim}
                        containerStyle={props.style}
                        size={20}
                        onPress={() => setIsAuthPasswordHidden(!isAuthPasswordHidden)}
                    />
                );
            },
        [isAuthPasswordHidden, colors.palette.neutral800],
    );
    const PasswordRightAccessoryRepeat: ComponentType<TextFieldAccessoryProps> = useMemo(
        () =>
            function PasswordRightAccessory(props: TextFieldAccessoryProps) {
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
        [isRepeatPasswordHidden, colors.palette.neutral800],
    );

    return (
        <Screen preset="fixed" contentContainerStyle={themed($screenContentContainer)} safeAreaEdges={['top', 'bottom']}>
            <HeaderTitle subLogoText={'forgotPasswordScreen:name'} />
            <Text tx="forgotPasswordScreen:description" style={themed($description)} />
            <View style={$container}>
                <TextField
                    value={String(form.newPassword)}
                    onChangeText={(v) => handleChange('newPassword', v)}
                    containerStyle={themed($textField)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="default"
                    secureTextEntry={isAuthPasswordHidden}
                    labelTx="forgotPasswordScreen:newPassword"
                    placeholderTx="common:passwordNewFieldPlaceholder"
                    helperTx={errors.newPassword}
                    status={errors.newPassword ? 'error' : undefined}
                    RightAccessory={PasswordRightAccessory}
                />
                <TextField
                    value={String(form.repeatPassword)}
                    onChangeText={(v) => handleChange('repeatPassword', v)}
                    containerStyle={themed($textField)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="default"
                    secureTextEntry={isRepeatPasswordHidden}
                    labelTx="forgotPasswordScreen:repeatPassword"
                    placeholderTx="common:repeatPasswordFieldPlaceholder"
                    helperTx={errors.repeatPassword}
                    status={errors.repeatPassword ? 'error' : undefined}
                    RightAccessory={PasswordRightAccessoryRepeat}
                />
                <View style={$spacer} />
                <Button
                    testID="signUp-button"
                    tx="common:continue"
                    style={themed($tapButton)}
                    preset="reversed"
                    onPress={request}
                />
                <TextButton testID="back-button" tx="common:back" style={themed($tapButton)} onPress={goBack} />
            </View>
        </Screen>
    );
};

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    flex: 1,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
});

const $textField: ThemedStyle<ViewStyle> = () => ({
    marginBottom: 0,
});

const $tapButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    marginTop: spacing.xs,
});

const $spacer: ViewStyle = {
    flex: 1,
};

const $container: ViewStyle = {
    flex: 1,
};
const $description: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
    fontSize: 14,
    fontFamily: typography.primary.medium,
    color: colors.textDim,
    lineHeight: 20,
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
});
