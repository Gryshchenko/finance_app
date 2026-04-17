import { FC, useCallback, useEffect, useState } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import {
    EmailConfirmationStatusType,
    ErrorCode,
    IEmailConfirmationResponse,
    IEmailResendResponse,
    Time,
    Utils,
} from 'tenpercent/shared';

import { Button } from '@/components/buttons/Button';
import { TextButton } from '@/components/buttons/TextButton';
import { HeaderTitle } from '@/components/HeaderTitle';
import { OtpCodeInput } from '@/components/OtpCodeInput';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useAuth } from '@/context/AuthContext';
import { useEditView } from '@/hooks/useEditView';
import { TxKeyPath } from '@/i18n';
import { translate } from '@/i18n/translate';
import type { AppStackScreenProps } from '@/navigators/AppNavigator';
import { signUpConfirmationShema } from '@/schems/validationSchemas';
import AlertService from '@/services/AlertService';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { AuthService } from '@/services/AuthService';
import { SignupService } from '@/services/SignUpService';
import ToastService from '@/services/ToastService';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { getMessageFromErrorCode } from '@/utils/getMessageFromErrorCode';
import { Logger } from '@/utils/logger/Logger';

interface SignUpConfirmationScreenProps extends AppStackScreenProps<'signUpConfirmation'> {}

const _logger: Logger = Logger.Of('SignUpConfirmationScreen');

export const SignUpConfirmationScreen: FC<SignUpConfirmationScreenProps> = () => {
    const { form, handleChange, errors, setErrors } = useEditView<{ confirmationCode: string | null }>(
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
        if (seconds > 0) {
            setIsResendDisabled(true);
        }
    }

    const resend = useCallback(async () => {
        const userId = AuthService.instance().userId;
        if (!userId) {
            _logger.error(`userId missed on resend action`);
            ToastService.info({ message: 'errorCode:UNEXPECTED_PROPERTY' });
            return;
        }
        try {
            const response = await SignupService.instance().doSignUpEmailResend({ userId });
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
                    const responseErrors = response?.errors ?? [];
                    for (const error of responseErrors) {
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
        } catch (e) {
            _logger.error(`Resend failed due reason: ${(e as { message: string }).message}`);
            AlertService.error(translate('common:error'), translate('errorCode:UNEXPECTED_PROPERTY' as TxKeyPath));
        }
    }, [doSetUserConfirmed, handleChange]);

    useEffect(() => {
        const handler = async () => {
            const userId = AuthService.instance().userId as number;
            const response = await SignupService.instance().getSignUpConfirmationCode(userId);
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

    async function verify(codeOverride?: string) {
        try {
            const confirmationCode = codeOverride ?? form.confirmationCode;
            if (resendTimer <= 0) {
                ToastService.error({ message: 'signUpConfirmation:expiredCode' });
                return;
            }
            if (!confirmationCode || errors.confirmationCode) return;
            const userId = AuthService.instance().userId;

            if (!userId) {
                _logger.error(`userId missed on verify action`);
                ToastService.error({ message: 'errorCode:UNEXPECTED_PROPERTY' });
                return;
            }

            const response = await SignupService.instance().doSignUpEmailVerify({
                userId,
                confirmationCode,
            });
            switch (response.kind) {
                case GeneralApiProblemKind.Ok: {
                    const { status } = response.data as IEmailResendResponse;
                    if (status === EmailConfirmationStatusType.Confirmed) {
                        doSetUserConfirmed();
                    }
                    break;
                }
                case GeneralApiProblemKind.BadData: {
                    const responseErrors = response.errors ?? [];
                    for (const error of responseErrors) {
                        const payload = error?.payload;
                        const errorCode = error?.errorCode;
                        if (payload?.field === 'confirmationCode') {
                            setErrors({ confirmationCode: 'validation:codeInvalided' });
                        } else if (errorCode) {
                            ToastService.error({ message: getMessageFromErrorCode(errorCode) });
                        }
                    }
                    break;
                }
                default: {
                    buildGeneralApiBaseHandler(response);
                }
            }
        } catch (e) {
            _logger.error(`Confirm failed due reason: ${(e as { message: string }).message}`);
            AlertService.error(translate('common:error'), translate('errorCode:UNEXPECTED_PROPERTY' as TxKeyPath));
        }
    }

    return (
        <Screen preset="auto" contentContainerStyle={themed($screenContentContainer)} safeAreaEdges={['top', 'bottom']}>
            <HeaderTitle subLogoText={'loginScreen:authorization'} />
            <View style={themed($content)}>
                <View style={themed($header)}>
                    <Text tx={'signUpConfirmation:title'} style={themed($title)}></Text>
                    <Text tx={'signUpConfirmation:description'} style={themed($subtitle)}></Text>
                </View>
                <KeyboardAwareScrollView bottomOffset={62}>
                    <OtpCodeInput
                        value={form?.confirmationCode ?? ''}
                        helperTx={errors?.confirmationCode}
                        status={errors?.confirmationCode ? 'error' : undefined}
                        onFinish={async (code: string) => {
                            handleChange('confirmationCode', code);
                            await verify(code);
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
                        disabled={
                            resendTimer <= 0 ||
                            !Utils.isEmpty(errors?.confirmationCode as string) ||
                            Utils.isEmpty(form?.confirmationCode as string)
                        }
                        onPress={() => verify()}
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
