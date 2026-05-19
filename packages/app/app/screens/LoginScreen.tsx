import { ComponentType, FC, useMemo, useRef, useState } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Pressable, TextInput, TextStyle, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button } from '@/components/buttons/Button';
import { HeaderTitle } from '@/components/HeaderTitle';
import { PressableIcon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { SignUpPrompt } from '@/components/SignUpPrompt';
import { Text } from '@/components/Text';
import { TextField, type TextFieldAccessoryProps } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { useEditView } from '@/hooks/useEditView';
import type { AppStackParamList, AppStackScreenProps } from '@/navigators/AppNavigator';
import { loginSchema } from '@/schems/validationSchemas';
import { GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { AppPath } from '@/types/AppPath';

interface LoginScreenProps extends AppStackScreenProps<AppPath.Login> {}

export const LoginScreen: FC<LoginScreenProps> = (_props) => {
    const authPasswordInput = useRef<TextInput>(null);
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState<boolean>(true);
    const { doLogin } = useAuth();
    const { form, handleChange, save, errors, setErrors } = useEditView<{ email: string; password: string }>(
        { email: 'andy1@test.com', password: 'Qwerty!23456#' },
        loginSchema,
    );

    const {
        themed,
        theme: { colors },
    } = useAppTheme();

    function signUp() {
        navigation.navigate({ name: AppPath.SignUp, params: undefined });
    }

    async function login() {
        const isValid = await save();
        if (!isValid) return;

        const response = await doLogin({
            password: form.password as string,
            email: form.email as string,
        });

        if (response.kind === GeneralApiProblemKind.Ok) {
            handleChange('email', '');
            handleChange('password', '');
        } else if (response.kind === GeneralApiProblemKind.BadData) {
            handleBadDataResponse(response.errors, setErrors, new Set(['email', 'password']));
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
        [isAuthPasswordHidden, colors.text],
    );

    return (
        <Screen preset="auto" contentContainerStyle={themed($screenContentContainer)} safeAreaEdges={['top', 'bottom']}>
            <HeaderTitle subLogoText={'loginScreen:authorization'} />

            <TextField
                value={String(form.email)}
                onChangeText={(v) => handleChange('email', v)}
                containerStyle={[themed($textField), themed($emailTextField)]}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                labelTx="common:emailFieldLabel"
                placeholderTx="common:emailFieldPlaceholder"
                helperTx={errors.email}
                status={errors.email ? 'error' : undefined}
                onSubmitEditing={() => authPasswordInput.current?.focus()}
            />

            <TextField
                ref={authPasswordInput}
                value={String(form.password)}
                onChangeText={(v) => handleChange('password', v)}
                containerStyle={themed($textField)}
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect={false}
                secureTextEntry={isAuthPasswordHidden}
                labelTx="common:passwordFieldLabel"
                placeholderTx="common:passwordFieldPlaceholder"
                onSubmitEditing={login}
                helperTx={errors.password}
                status={errors.password ? 'error' : undefined}
                RightAccessory={PasswordRightAccessory}
            />

            <Pressable onPress={() => navigation.navigate({ name: AppPath.ForgotPasswordRequest, params: undefined })}>
                <Text tx={'loginScreen:forgotPassword'} style={themed($forgotPassword)} />
            </Pressable>

            <Button
                testID="login-button"
                tx="loginScreen:login"
                style={[themed($tapButton), themed($loginButton)]}
                preset="reversed"
                onPress={login}
            />

            <SignUpPrompt onSignUp={signUp} />
            {/*<QuickAccessButton onPress={() => null} />*/}
        </Screen>
    );
};

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
});
const $forgotPassword: ThemedStyle<TextStyle> = ({ typography, colors }) => ({
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: colors.textDim,
    fontFamily: typography.fonts.funnelSans.normal,
    textAlign: 'right',
    marginTop: -10,
});

const $textField: ThemedStyle<ViewStyle> = () => ({
    marginBottom: 0,
});

const $emailTextField: ThemedStyle<ViewStyle> = () => ({
    marginTop: 40,
});

const $tapButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    marginTop: spacing.xs,
});

const $loginButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    marginTop: spacing.xxl,
});
