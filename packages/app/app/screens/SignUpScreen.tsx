import { ComponentType, FC, useEffect, useMemo, useRef, useState } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Switch, TextInput, TextStyle, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
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
import { useEditView } from '@/hooks/useEditView';
import { IClientConfigLanguage } from '@/interfaces/IClientConfigLanguages';
import type { AppStackScreenProps } from '@/navigators/AppNavigator';
import { buildSignUpSchema } from '@/schems/validationSchemas';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { AppPath } from '@/types/AppPath';
import detectLanguage from '@/utils/detectLanguage';
import { Logger } from '@/utils/logger/Logger';
import { ValidationTypes } from '@/utils/validation';

interface SignUpScreenProps extends AppStackScreenProps<AppPath.SignUp> {}

export const SignUpScreen: FC<SignUpScreenProps> = (_props) => {
    const authPasswordInput = useRef<TextInput>(null);
    const { navigation } = _props;
    const [config, setConfig] = useState<IClientConfigLanguage[]>();
    const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true);
    const [enableBiometric, setEnableBiometric] = useState(false);
    const { doSignUp } = useAuth();
    const { isAvailable: isBiometricAvailable, biometricType, enroll } = useBiometricSetup();

    const schema = useMemo(
        () => buildSignUpSchema(config?.map((c) => c.locale) ?? [], config?.map((c) => c.currencyCode) ?? []),
        [config],
    );

    const { form, handleChange, save, errors, setErrors } = useEditView<{
        publicName: string;
        email: string;
        password: string;
        locale: string;
        currency: string;
    }>({ publicName: '', email: '', password: '', locale: '', currency: '' }, schema);

    useEffect(() => {
        const setDefault = () => {
            handleChange('currency', 'USD');
            handleChange('locale', 'en-US');
        };
        const fetcher = async () => {
            try {
                const currentUserLocale: string = detectLanguage();
                const data = await fetchConfig();
                if (Utils.isArrayNotEmpty(data!)) {
                    const match = data?.find((item) => {
                        const locale = item.locale.split('-')[0];
                        return locale === currentUserLocale;
                    });
                    setConfig(data);
                    if (Utils.isNotNull(match!)) {
                        const inWork = match as IClientConfigLanguage;
                        handleChange('currency', inWork.currencyCode);
                        handleChange('locale', inWork.locale);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const {
        themed,
        theme: { colors },
    } = useAppTheme();

    function goBack() {
        navigation.navigate({ name: AppPath.Login, params: undefined });
    }

    async function signUp() {
        const isValid = await save();
        if (!isValid) return;

        const response = await doSignUp({
            password: form.password as string,
            email: form.email as string,
            publicName: form.publicName as string,
            locale: form.locale as string,
            currencyCode: form.currency as string,
        });
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                handleChange('publicName', '');
                handleChange('email', '');
                handleChange('password', '');
                // Biometric enrollment: triggers the native Face ID / fingerprint
                // dialog. On iOS this also requests the NSFaceIDUsageDescription
                // permission. We fire-and-forget - a failure is non-fatal.
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
                        setErrors((prev) => ({ ...prev, email: ValidationTypes.EMAIL_UNIQUE }));
                    } else if (payload?.field === 'email') {
                        setErrors((prev) => ({ ...prev, email: ValidationTypes.REQUIRED }));
                    }
                    if (payload?.field === 'password') {
                        setErrors((prev) => ({ ...prev, password: ValidationTypes.REQUIRED }));
                    }
                    if (payload?.field === 'locale') {
                        setErrors((prev) => ({ ...prev, locale: ValidationTypes.REQUIRED }));
                    }
                    if (payload?.field === 'publicName') {
                        setErrors((prev) => ({ ...prev, publicName: ValidationTypes.REQUIRED }));
                    }
                    if (payload?.field === 'currencyId') {
                        setErrors((prev) => ({ ...prev, currency: ValidationTypes.REQUIRED }));
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
                        color={colors.textDim}
                        containerStyle={props.style}
                        size={20}
                        onPress={() => setIsAuthPasswordHidden(!isAuthPasswordHidden)}
                    />
                );
            },
        [isAuthPasswordHidden, colors.textDim],
    );

    return (
        <Screen preset="fixed" contentContainerStyle={themed($screenContentContainer)} safeAreaEdges={['top']}>
            <HeaderTitle subLogoText={'signUpScreen:signup'} />
            <Text tx={'signUpScreen:title'} preset="default" style={themed($title)} />
            <Text tx={'signUpScreen:subTitle'} preset="default" style={themed($subTitle)} />

            <KeyboardAwareScrollView bottomOffset={62}>
                <TextField
                    value={String(form.publicName)}
                    onChangeText={(v) => handleChange('publicName', v)}
                    containerStyle={themed($textField)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="default"
                    labelTx="common:publicNameFieldLabel"
                    placeholderTx="common:publicNameFieldPlaceholder"
                    helperTx={errors.publicName}
                    status={errors.publicName ? 'error' : undefined}
                    onSubmitEditing={() => authPasswordInput.current?.focus()}
                />
                <TextField
                    value={String(form.email)}
                    onChangeText={(v) => handleChange('email', v)}
                    containerStyle={themed($textField)}
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
                    helperTx={errors.password}
                    status={errors.password ? 'error' : undefined}
                    secureTextEntry={isAuthPasswordHidden}
                    labelTx="common:passwordFieldLabel"
                    placeholderTx="common:passwordFieldPlaceholder"
                    RightAccessory={PasswordRightAccessory}
                />
                <LanguageDropdown
                    value={String(form.locale)}
                    disabled={false}
                    helperTx={errors.locale}
                    status={errors.locale ? 'error' : undefined}
                    onChange={(v) => handleChange('locale', v.locale)}
                />
                <CurrencyDropdown
                    value={String(form.currency)}
                    helperTx={errors.currency}
                    status={errors.currency ? 'error' : undefined}
                    onChange={(v) => handleChange('currency', v.currencyCode)}
                />
                {isBiometricAvailable && (
                    <View style={themed($biometricRow)}>
                        <View style={$biometricInfo}>
                            <MaterialIcons
                                name={biometricType === 'face' ? 'face' : 'fingerprint'}
                                size={28}
                                color={colors.text}
                            />
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

                <Button
                    testID="signUp-button"
                    tx="common:continue"
                    style={themed($tapButton)}
                    preset="reversed"
                    onPress={signUp}
                />
                <TextButton testID="back-button" tx="common:back" style={themed($tapButton)} onPress={goBack} />
            </KeyboardAwareScrollView>
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
