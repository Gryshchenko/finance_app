import { ComponentType, FC, useEffect, useMemo, useRef, useState } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Switch, TextInput, TextStyle, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ErrorCode, Utils } from 'tenpercent/shared';

import { Button } from '@/components/buttons/Button';
import { TextButton } from '@/components/buttons/TextButton';
import { CurrencyDropdown } from '@/components/CurrencyDropdown';
import { HeaderTitle } from '@/components/HeaderTitle';
import { PressableIcon } from '@/components/Icon';
import { fetchConfig, LanguageDropdown } from '@/components/LanguagesDropdown';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField, type TextFieldAccessoryProps } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { useBiometricSetup } from '@/hooks/useBiometricSetup';
import { TxKeyPath } from '@/i18n';
import { IClientConfigLanguage } from '@/interfaces/IClientConfigLanguages';
import type { AppStackScreenProps } from '@/navigators/AppNavigator';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import detectLanguage from '@/utils/detectLanguage';
import { Logger } from '@/utils/logger/Logger';
import {
    validateCurrency,
    validateEmail,
    validateLanguage,
    validatePassword,
    validatePublicName,
    ValidationTypes,
} from '@/utils/validation';

interface SignUpScreenProps extends AppStackScreenProps<'SignUp'> {}

export const SignUpScreen: FC<SignUpScreenProps> = (_props) => {
    const authPasswordInput = useRef<TextInput>(null);
    const { navigation } = _props;
    const [config, setConfig] = useState<IClientConfigLanguage[]>();
    const [authPassword, setAuthPassword] = useState<string>('');
    const [publicName, setPublicName] = useState<string>('');
    const [language, setLanguage] = useState<string>('');
    const [currency, setCurrency] = useState<string>('');
    const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true);
    const [authEmail, setAuthEmail] = useState<string>('');
    const [publicNameError, setPublicNameError] = useState<TxKeyPath | undefined>();
    const [emailError, setEmailError] = useState<TxKeyPath | undefined>();
    const [passwordError, setPasswordError] = useState<TxKeyPath | undefined>();
    const [languageError, setLanguageError] = useState<TxKeyPath | undefined>();
    const [currencyError, setCurrencyError] = useState<TxKeyPath | undefined>();
    const [enableBiometric, setEnableBiometric] = useState(false);
    const { doSignUp } = useAuth();
    const { isAvailable: isBiometricAvailable, biometricType, enroll } = useBiometricSetup();

    useEffect(() => {
        const setDefault = () => {
            setCurrency('USD');
            setLanguage('en-US');
        };
        const fetcher = async () => {
            try {
                const currentUserLocale: string = detectLanguage();
                const data = await fetchConfig();
                if (Utils.isArrayNotEmpty(data!)) {
                    const config = data?.find((data) => {
                        const locale = data.locale.split('-')[0];
                        return locale === currentUserLocale;
                    });
                    setConfig(data);
                    if (Utils.isNotNull(config!)) {
                        const inWork = config as IClientConfigLanguage;
                        setCurrency(inWork.currencyCode);
                        setLanguage(inWork.locale);
                        return;
                    } else {
                        setDefault();
                    }
                }
            } catch (e) {
                Logger.Of('SignUpScreen').error(e);
                setDefault();
            }
        };
        void fetcher();
    }, []);

    const {
        themed,
        theme: { colors },
    } = useAppTheme();

    function goBack() {
        navigation.navigate({ name: 'login', params: undefined });
    }
    async function signUp() {
        const emailErr = validateEmail(authEmail);
        const passwordErr = validatePassword(authPassword);
        const publicNameError = validatePublicName(publicName);
        const languageError = validateLanguage(language, config);
        const currencyError = validateCurrency(currency, config);

        setPublicNameError(publicNameError);
        setEmailError(emailErr);
        setPasswordError(passwordErr);
        setLanguageError(languageError);
        setCurrencyError(currencyError);

        if (emailErr || passwordErr || publicNameError || currencyError || languageError) {
            return;
        }

        const response = await doSignUp({
            password: authPassword as string,
            email: authEmail as string,
            publicName: publicName as string,
            locale: language,
            currencyCode: currency,
        });
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                setPublicName('');
                setAuthEmail('');
                setAuthPassword('');
                // Biometric enrollment: triggers the native Face ID / fingerprint
                // dialog. On iOS this also requests the NSFaceIDUsageDescription
                // permission. We fire-and-forget — a failure is non-fatal.
                if (enableBiometric && isBiometricAvailable) {
                    await enroll();
                }
                break;
            }
            case GeneralApiProblemKind.BadData: {
                const errors = response.errors ?? [];
                for (const error of errors) {
                    const payload = error?.payload;
                    const errorCode = error?.errorCode;
                    if (errorCode === ErrorCode.SIGNUP_USER_ALREADY_EXISTS_ERROR) {
                        setEmailError(ValidationTypes.EMAIL_UNIQUE);
                    } else if (payload?.field === 'email') {
                        setEmailError(ValidationTypes.REQUIRED);
                    }
                    if (payload?.field === 'password') {
                        setPasswordError(ValidationTypes.REQUIRED);
                    }
                    if (payload?.field === 'locale') {
                        setLanguageError(ValidationTypes.REQUIRED);
                    }
                    if (payload?.field === 'publicName') {
                        setPublicNameError(ValidationTypes.REQUIRED);
                    }
                    if (payload?.field === 'currencyId') {
                        setCurrencyError(ValidationTypes.REQUIRED);
                    }
                }
                break;
            }
            case GeneralApiProblemKind.Unknown: {
                break;
            }
        }
    }

    const PasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
        () =>
            function PasswordRightAccessory(props: TextFieldAccessoryProps) {
                return (
                    <PressableIcon
                        icon={isAuthPasswordHidden ? 'view' : 'hidden'}
                        color={colors.palette.neutral800}
                        containerStyle={props.style}
                        size={20}
                        onPress={() => setIsAuthPasswordHidden(!isAuthPasswordHidden)}
                    />
                );
            },
        [isAuthPasswordHidden, colors.palette.neutral800],
    );

    return (
        <Screen preset="auto" contentContainerStyle={themed($screenContentContainer)} safeAreaEdges={['top', 'bottom']}>
            <HeaderTitle subLogoText={'signUpScreen:signup'} />

            <Text tx={'signUpScreen:title'} preset="heading" style={themed($title)} />
            <Text tx={'signUpScreen:subTitle'} preset="heading" style={themed($subTitle)} />

            <TextField
                value={publicName}
                onChangeText={setPublicName}
                containerStyle={themed($textField)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                labelTx="common:publicNameFieldLabel"
                placeholderTx="common:publicNameFieldPlaceholder"
                helperTx={publicNameError}
                status={publicNameError ? 'error' : undefined}
                onSubmitEditing={() => authPasswordInput.current?.focus()}
            />
            <TextField
                value={authEmail}
                onChangeText={setAuthEmail}
                containerStyle={themed($textField)}
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
                onChangeText={setAuthPassword}
                containerStyle={themed($textField)}
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect={false}
                helperTx={passwordError}
                status={passwordError ? 'error' : undefined}
                secureTextEntry={isAuthPasswordHidden}
                labelTx="common:passwordFieldLabel"
                placeholderTx="common:passwordFieldPlaceholder"
                RightAccessory={PasswordRightAccessory}
            />
            <LanguageDropdown
                value={language}
                disabled={false}
                helperTx={languageError}
                status={Utils.isNotNull(languageError) ? 'error' : undefined}
                onChange={(v) => setLanguage(v.locale)}
            />
            <CurrencyDropdown
                value={currency}
                helperTx={currencyError}
                status={Utils.isNotNull(currencyError) ? 'error' : undefined}
                onChange={(v) => setCurrency(v.currencyCode)}
            />

            {isBiometricAvailable && (
                <View style={themed($biometricRow)}>
                    <View style={$biometricInfo}>
                        <MaterialIcons name={biometricType === 'face' ? 'face' : 'fingerprint'} size={28} color={colors.text} />
                        <View style={$biometricTextBlock}>
                            <Text tx="signUpScreen:biometricTitle" style={themed($biometricTitle)} />
                            <Text
                                tx={
                                    biometricType === 'face'
                                        ? 'signUpScreen:biometricSubtitleFace'
                                        : 'signUpScreen:biometricSubtitleFingerprint'
                                }
                                style={themed($biometricSubtitle)}
                            />
                        </View>
                    </View>
                    <Switch
                        value={enableBiometric}
                        onValueChange={setEnableBiometric}
                        trackColor={{
                            false: colors.palette.neutral300,
                            true: colors.palette.primary500,
                        }}
                        thumbColor={colors.palette.neutral100}
                        // iOS: renders the system switch; Android: Material switch
                        accessibilityLabel="Enable biometric authentication"
                    />
                </View>
            )}

            <Button testID="signUp-button" tx="common:continue" style={themed($tapButton)} preset="reversed" onPress={signUp} />
            <TextButton testID="back-button" tx="common:back" style={themed($tapButton)} onPress={goBack} />
        </Screen>
    );
};

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
});

const $textField: ThemedStyle<ViewStyle> = () => ({
    marginBottom: 0,
});

const $tapButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    marginTop: spacing.xs,
});

const $title: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
    fontSize: 27,
    lineHeight: 32, // leading-tight
    fontWeight: '500', // font-medium
    color: colors.text, // text-brand-black
    fontFamily: typography.fonts.funnelSans.medium,
    marginTop: spacing.xl,
});

const $subTitle: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
    color: colors.textDim,
    fontFamily: typography.fonts.funnelSans.medium,
    fontSize: 27,
    lineHeight: 25,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
});

const $biometricRow: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.separator,
});

// Static styles (no theme dependency)
const $biometricInfo: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
};

const $biometricTextBlock: ViewStyle = {
    flex: 1,
};

const $biometricTitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.fonts.funnelSans.semiBold,
});

const $biometricSubtitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 12,
    color: colors.textDim,
    fontFamily: typography.fonts.funnelSans.light,
    marginTop: 2,
});
