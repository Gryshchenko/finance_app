import { FC, useCallback, useEffect, useState } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import {
    EmailConfirmationStatusType,
    ErrorCode,
    IEmailConfirmationResponse,
    IEmailResendResponse,
    Time,
} from 'tenpercent/shared';

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
import { buildGeneralApiBaseHandler, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { EmailConfirmationService } from '@/services/EmailConfirmationService';
import ToastService from '@/services/ToastService';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { getMessageFromErrorCode } from '@/utils/getMessageFromErrorCode';

interface SignUpConfirmationScreenProps extends AppStackScreenProps<'signUpConfirmation'> {}

export const SignUpConfirmationScreen: FC<SignUpConfirmationScreenProps> = () => {
    const { form, handleChange, save, errors, setErrors } = useEditView<{ confirmationCode: string | null }>(
        { confirmationCode: null },
        signUpConfirmationShema,
    );
    const [isResendDisabled, setIsResendDisabled] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const { doSetUserConfirmed, doLogout } = useAuth();

    const { themed } = useAppTheme();

    function setTimer(expiresAt: string) {
        const seconds = Time.getSecondsLeft(expiresAt);
        setResendTimer(seconds);
        if (seconds > 0) setIsResendDisabled(true);
    }

    const handleVerify = async (confirmationCode: string) => {
        if (resendTimer <= 0) {
            ToastService.error({ message: 'signUpConfirmation:expiredCode' });
            return;
        }

        const response = await EmailConfirmationService.instance().confirm(confirmationCode);
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                const { status } = response.data as IEmailResendResponse;
                if (status === EmailConfirmationStatusType.Confirmed) {
                    doSetUserConfirmed();
                }
                break;
            }
            case GeneralApiProblemKind.BadData: {
                for (const error of response.errors ?? []) {
                    if (error?.payload?.field === 'confirmationCode') {
                        setErrors({ confirmationCode: 'validation:codeInvalided' });
                    } else if (error?.errorCode) {
                        ToastService.error({ message: getMessageFromErrorCode(error.errorCode) });
                    }
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
                const { expiresAt, status } = response.data as IEmailResendResponse;
                if (status === EmailConfirmationStatusType.Confirmed) {
                    doSetUserConfirmed();
                } else {
                    ToastService.info({ message: 'signUpConfirmation:codeSent' });
                    setTimer(expiresAt);
                    handleChange('confirmationCode', '');
                }
                break;
            }
            case GeneralApiProblemKind.BadData: {
                for (const error of response?.errors ?? []) {
                    const errorCode = error?.errorCode;
                    if (errorCode === ErrorCode.EMAIL_VERIFICATION_CODE_EXPIRED_ERROR) {
                        ToastService.error({ message: 'errorCode:EMAIL_VERIFICATION_CODE_EXPIRED_ERROR' });
                    } else if (errorCode === ErrorCode.EMAIL_VERIFICATION_CODE_STILL_ACTIVE_ERROR) {
                        ToastService.error({ message: 'errorCode:EMAIL_VERIFICATION_CODE_STILL_ACTIVE_ERROR' });
                    }
                }
                break;
            }
            default: {
                buildGeneralApiBaseHandler(response);
            }
        }
    }, [doSetUserConfirmed, handleChange]);

    useEffect(() => {
        const handler = async () => {
            const response = await EmailConfirmationService.instance().getCode();
            switch (response.kind) {
                case GeneralApiProblemKind.Ok: {
                    const { expiresAt } = response.data as IEmailConfirmationResponse;
                    if (!expiresAt) {
                        await resend();
                    } else {
                        setTimer(expiresAt);
                    }
                    break;
                }
                default: {
                    setResendTimer(0);
                    buildGeneralApiBaseHandler(response);
                }
            }
        };
        void handler();
    }, [resend]);

    useEffect(() => {
        if (!isResendDisabled || resendTimer <= 0) {
            if (resendTimer <= 0) setIsResendDisabled(false);
            return;
        }
        const timer: ReturnType<typeof setTimeout> = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [isResendDisabled, resendTimer]);

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
                    <Text tx={resendTimer <= 0 ? 'signUpConfirmation:invalidCode' : undefined} style={themed($timer)}>
                        {resendTimer <= 0 ? '' : Time.secondsToMinutes(resendTimer)}
                    </Text>
                    <Button
                        testID="signUp-button"
                        tx="signUpConfirmation:confirmButton"
                        style={themed($tapButton)}
                        preset={'reversed'}
                        disabled={resendTimer <= 0 || !!errors.confirmationCode || !form.confirmationCode}
                        onPress={handleConfirm}
                    />
                    <TextButton
                        tx={'signUpConfirmation:resendButton'}
                        style={themed($tapButton)}
                        onPress={resend}
                        preset={'reversed'}
                        disabled={isResendDisabled}
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
