import { ComponentType, FC, useMemo, useRef, useState } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Pressable, TextInput, TextStyle, ViewStyle } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { HeaderTitle } from '@/components/HeaderTitle';
import { PressableIcon } from '@/components/Icon';
import { QuickAccessButton } from '@/components/QuickAccessButton';
import { Screen } from '@/components/Screen';
import { SignUpPrompt } from '@/components/SignUpPrompt';
import { Text } from '@/components/Text';
import { TextField, type TextFieldAccessoryProps } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { TxKeyPath } from '@/i18n';
import type { AppStackScreenProps } from '@/navigators/AppNavigator';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { validateEmail, validatePassword } from '@/utils/validation';

interface LoginScreenProps extends AppStackScreenProps<'Login'> {}

export const LoginScreen: FC<LoginScreenProps> = (_props) => {
    const authPasswordInput = useRef<TextInput>(null);
    const { navigation } = _props;
    const [authPassword, setAuthPassword] = useState<string>('Qwerty!2345');
    const [authEmail, setAuthEmail] = useState<string>('andy@test.com');
    const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState<boolean>(true);
    const [emailError, setEmailError] = useState<TxKeyPath | undefined>();
    const [passwordError, setPasswordError] = useState<TxKeyPath | undefined>();
    const { doLogin } = useAuth();

    const {
        themed,
        theme: { colors },
    } = useAppTheme();

    function signUp() {
        navigation.navigate({ name: 'signUp', params: undefined });
    }

    async function login() {
        const emailErr = validateEmail(authEmail);
        const passwordErr = validatePassword(authPassword);
        setEmailError(emailErr);
        setPasswordError(passwordErr);

        if (emailErr || passwordErr) {
            return;
        }
        const result = await doLogin({
            password: authPassword as string,
            email: authEmail as string,
        });
        if (result) {
            setAuthEmail('');
            setAuthPassword('');
        }
    }

    const PasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
        () =>
            function PasswordRightAccessory(props: TextFieldAccessoryProps) {
                return (
                    <PressableIcon
                        icon={isAuthPasswordHidden ? 'view' : 'hidden'}
                        color={colors.text}
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
                value={authEmail}
                onChangeText={(email) => {
                    if (emailError) {
                        setEmailError(validateEmail(email));
                    }
                    setAuthEmail(email);
                }}
                containerStyle={[themed($textField), themed($emailTextField)]}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                labelTx="common:emailFieldLabel"
                placeholderTx="common:emailFieldPlaceholder"
                helperTx={emailError}
                status={emailError ? 'error' : undefined}
                onSubmitEditing={() => authPasswordInput.current?.focus()}
            />

            <TextField
                ref={authPasswordInput}
                value={authPassword}
                onChangeText={(password) => {
                    if (passwordError) {
                        setPasswordError(validatePassword(password));
                    }
                    setAuthPassword(password);
                }}
                containerStyle={themed($textField)}
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect={false}
                secureTextEntry={isAuthPasswordHidden}
                labelTx="common:passwordFieldLabel"
                placeholderTx="common:passwordFieldPlaceholder"
                onSubmitEditing={login}
                helperTx={passwordError}
                status={passwordError ? 'error' : undefined}
                RightAccessory={PasswordRightAccessory}
            />

            <Pressable>
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
            <QuickAccessButton onPress={() => null} />
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
    marginTop: -20,
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
