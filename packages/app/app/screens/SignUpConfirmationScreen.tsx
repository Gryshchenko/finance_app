import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Time, Utils } from 'tenpercent/shared';

import { Button } from '@/components/buttons/Button';
import { TextButton } from '@/components/buttons/TextButton';
import { HeaderTitle } from '@/components/HeaderTitle';
import { OtpCodeInput } from '@/components/OtpCodeInput';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useAuth } from '@/context/AuthContext';
import { useEditView } from '@/hooks/useEditView';
import type { AppStackScreenProps } from '@/navigators/AppNavigator';
import { signUpConfirmationShema } from '@/schems/validationSchemas';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, parseServerErrors } from '@/services/api/apiProblem';
import { EmailConfirmationService } from '@/services/EmailConfirmationService';
import ToastService from '@/services/ToastService';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';

interface SignUpConfirmationScreenProps extends AppStackScreenProps<'signUpConfirmation'> {}

export const SignUpConfirmationScreen: FC<SignUpConfirmationScreenProps> = () => {
    const { form, handleChange, save, errors, setErrors } = useEditView<{ confirmationCode: string | null }>(
        { confirmationCode: null },
        signUpConfirmationShema,
    );
    const [resendTimer, setResendTimer] = useState(120);
    const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    const clearTimer = () => {
        if (timerRef.current !== undefined) {
            clearInterval(timerRef.current);
            timerRef.current = undefined;
        }
    };
    const { doSetUserConfirmed, doLogout } = useAuth();

    const { themed } = useAppTheme();

    const startTimer = (seconds: number = 120) => {
        clearTimer();
        setResendTimer(seconds);
        timerRef.current = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    timerRef.current = undefined;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        startTimer();
        return clearTimer;
    }, []);

    const handleVerify = async (confirmationCode: string) => {
        const response = await EmailConfirmationService.instance().confirm(confirmationCode);
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                doSetUserConfirmed();
                break;
            }
            case GeneralApiProblemKind.BadData: {
                const { fieldErrors, hasNonFieldErrors } = parseServerErrors(response.errors);
                if (Object.keys(fieldErrors).length > 0) {
                    setErrors(fieldErrors as any);
                }
                if (hasNonFieldErrors) {
                    ToastService.error({ title: 'common:error', message: 'settingsChangeEmailScreen:updateFailed' });
                }
                break;
            }
            default: {
                buildGeneralApiBaseHandler(response);
            }
        }
    };

    const handleConfirm = async () => {
        const isValid = await save();
        if (!isValid || !form.confirmationCode) return;
        await handleVerify(form.confirmationCode);
    };

    const resend = useCallback(async () => {
        const response = await EmailConfirmationService.instance().refreshCode();
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                startTimer();
                handleChange('confirmationCode', '');
                break;
            }
            case GeneralApiProblemKind.BadData: {
                const { fieldErrors, hasNonFieldErrors } = parseServerErrors(response.errors);
                if (Object.keys(fieldErrors).length > 0) {
                    setErrors(fieldErrors as any);
                }
                if (hasNonFieldErrors) {
                    ToastService.error({ title: 'common:error', message: 'signUpScreen:updateFailed' });
                }
                break;
            }
            default: {
                buildGeneralApiBaseHandler(response);
            }
        }
    }, [handleChange, setErrors]);

    return (
        <Screen preset="auto" contentContainerStyle={themed($screenContentContainer)} safeAreaEdges={['top', 'bottom']}>
            <HeaderTitle subLogoText={'loginScreen:authorization'} />
            <View style={themed($content)}>
                <View style={themed($header)}>
                    <Text tx={'signUpConfirmation:title'} style={themed($title)} />
                    <Text tx={'signUpConfirmation:description'} style={themed($subtitle)} />
                </View>
                <KeyboardAwareScrollView bottomOffset={62}>
                    <OtpCodeInput
                        value={form?.confirmationCode ?? ''}
                        helperTx={errors?.confirmationCode}
                        status={errors?.confirmationCode ? 'error' : undefined}
                        onFinish={async (code: string) => {
                            handleChange('confirmationCode', code);
                            await handleVerify(code);
                        }}
                    />
                </KeyboardAwareScrollView>
                <View style={themed($screen)}>
                    {resendTimer > 0 && (
                        <View style={$timerRow}>
                            <Text tx="signUpScreen:timerHelper" style={themed($timerHelper)} />
                            <Text style={themed($timer)}>{Time.secondsToMinutes(resendTimer)}</Text>
                        </View>
                    )}
                    <Button
                        testID="signUp-button"
                        tx="signUpConfirmation:confirmButton"
                        style={themed($tapButton)}
                        preset={'reversed'}
                        disabled={
                            !Utils.isEmpty(errors?.confirmationCode as string) || Utils.isEmpty(form?.confirmationCode as string)
                        }
                        onPress={handleConfirm}
                    />
                    <TextButton
                        tx={'signUpConfirmation:resendButton'}
                        style={themed($tapButton)}
                        onPress={resend}
                        preset={'reversed'}
                        disabled={resendTimer > 0}
                    />
                    <TextButton style={themed($tapButton)} tx="signUpConfirmation:goToLogin" onPress={doLogout} />
                </View>
            </View>
        </Screen>
    );
};

export const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    marginTop: 40,
    alignItems: 'center',
    marginBottom: spacing.xxl,
});

export const $title: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 24,
    fontFamily: typography.primary.bold,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
});

export const $subtitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 14,
    fontFamily: typography.primary.medium,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 20,
});

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
});

export const $timer: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
    marginTop: spacing.md,
    marginBottom: spacing.md,
    color: colors.textDim,
    fontSize: 14,
    fontFamily: typography.primary.medium,
    letterSpacing: 1,
    textAlign: 'center',
});

const $tapButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    marginTop: spacing.xs,
    width: '100%',
});

export const $screen: ThemedStyle<ViewStyle> = () => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
});

export const $content: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    width: '100%',
    alignSelf: 'center',
    marginTop: 100,
});

const $timerRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    gap: 6,
    marginBottom: 8,
};
const $timerHelper: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    color: colors.textDim,
    fontSize: 14,
    fontFamily: typography.primary.medium,
});
