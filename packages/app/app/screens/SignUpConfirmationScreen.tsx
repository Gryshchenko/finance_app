import { FC, useEffect, useState } from 'react';
import { TextStyle, ViewStyle } from 'react-native';
import { IEmailConfirmationResponse } from 'tenpercent/shared';
import { IEmailResendResponse } from 'tenpercent/shared';
import { EmailConfirmationStatusType } from 'tenpercent/shared';
import { ErrorCode } from 'tenpercent/shared';
import { Time } from 'tenpercent/shared';

import { Button } from '@/components/buttons/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { TxKeyPath } from '@/i18n';
import { translate } from '@/i18n/translate';
import type { AppStackScreenProps } from '@/navigators/AppNavigator';
import AlertService from '@/services/AlertService';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { AuthService } from '@/services/AuthService';
import { SignupService } from '@/services/SignUpService';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { Logger } from '@/utils/logger/Logger';
import { useHeader } from '@/utils/useHeader';
import { validateCode } from '@/utils/validation';

interface SignUpConfirmationScreenProps extends AppStackScreenProps<'SignUpConfirmation'> {}

const _logger: Logger = Logger.Of('SignUpConfirmationScreen');

export const SignUpConfirmationScreen: FC<SignUpConfirmationScreenProps> = () => {
    const [confirmationCode, setConfirmationCode] = useState<string>('');
    const [validationCodeError, setValidationCodeError] = useState<TxKeyPath | undefined>();
    const [isResendDisabled, setIsResendDisabled] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const { doSetUserConfirmed } = useAuth();

    const { themed } = useAppTheme();
    const { doLogout } = useAuth();

    useHeader(
        {
            rightTx: 'common:logOut',
            onRightPress: doLogout,
        },
        [doLogout],
    );

    function setTimer(expiresAt: string) {
        const seconds = Time.getSecondsLeft(expiresAt);
        setResendTimer(seconds);
        if (seconds > 0) {
            setIsResendDisabled(true);
        }
    }

    function unexpectedProperties(context: string, payload: unknown): void {
        _logger.error(`${context} failed due reason: ${JSON.stringify(payload)}`);
        setValidationCodeError('errorCode:UNEXPECTED_PROPERTY');
    }

    useEffect(() => {
        const handler = async () => {
            const userId = AuthService.instance().userId as number;
            const response = await SignupService.instance().getSignUpConfirmationCode(userId);
            switch (response.kind) {
                case GeneralApiProblemKind.Ok: {
                    const { expiresAt } = response.data as IEmailConfirmationResponse;
                    setTimer(expiresAt);
                    break;
                }
                default: {
                    buildGeneralApiBaseHandler(response);
                }
            }
        };
        handler();
    }, []);

    useEffect(() => {
        let timer: unknown;
        if (isResendDisabled && resendTimer > 0) {
            timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000) as unknown;
        } else if (resendTimer === 0) {
            setIsResendDisabled(false);
            setResendTimer(60);
        }
        return () => clearTimeout(timer as number);
    }, [isResendDisabled, resendTimer]);

    async function verify() {
        try {
            const userId = AuthService.instance().userId;
            const codeErr = validateCode(confirmationCode);

            setValidationCodeError(codeErr);
            if (codeErr) {
                return;
            }

            if (!userId) {
                _logger.error(`userId missed on verify action`);
                AlertService.error(translate('common:error'), translate('errorCode:UNEXPECTED_PROPERTY' as TxKeyPath));
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
                    } else {
                        unexpectedProperties('Verify', 'mail not confirmed');
                    }
                    break;
                }
                case GeneralApiProblemKind.BadData: {
                    unexpectedProperties('Verify', response);
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

    async function resend() {
        const userId = AuthService.instance().userId;
        if (!userId) {
            _logger.error(`userId missed on verify action`);
            AlertService.error(translate('common:error'), translate('errorCode:UNEXPECTED_PROPERTY' as TxKeyPath));
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
                        setTimer(expiresAt);
                    }
                    break;
                }
                case GeneralApiProblemKind.BadData: {
                    const errors = response?.errors ?? [];
                    for (const error of errors) {
                        const errorCode = error?.errorCode;
                        if (errorCode === ErrorCode.EMAIL_VERIFICATION_CODE_EXPIRED_ERROR) {
                            setValidationCodeError('errorCode:EMAIL_VERIFICATION_CODE_EXPIRED_ERROR');
                        } else if (errorCode === ErrorCode.EMAIL_VERIFICATION_CODE_STILL_ACTIVE_ERROR) {
                            setValidationCodeError('errorCode:EMAIL_VERIFICATION_CODE_STILL_ACTIVE_ERROR');
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
    }
    return (
        <Screen preset="auto" contentContainerStyle={themed($screenContentContainer)} safeAreaEdges={['top', 'bottom']}>
            <Text testID="signUp-heading" tx="signUpConfirmation:title" preset="heading" style={themed($logIn)} />
            <Text tx="signUpConfirmation:description" preset="subheading" style={themed($enterDetails)} />

            <TextField
                value={confirmationCode}
                onChangeText={(code) => {
                    if (validationCodeError) {
                        setValidationCodeError(validateCode(code));
                    }
                    setConfirmationCode(code);
                }}
                containerStyle={themed($textField)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="numeric"
                labelTx="common:confirmationCodeFieldLabel"
                placeholderTx="common:confirmationCodeFieldPlaceholder"
                helperTx={validationCodeError}
                status={validationCodeError ? 'error' : undefined}
                maxLength={8}
            />

            <Button
                testID="signUp-button"
                tx="signUpConfirmation:confirmButton"
                style={themed($tapButton)}
                preset="reversed"
                onPress={verify}
            />

            <Button
                tx={isResendDisabled ? 'signUpConfirmation:resendInfo' : 'signUpConfirmation:resendButton'}
                txOptions={isResendDisabled ? { seconds: Time.secondsToMinutes(resendTimer) } : undefined}
                style={themed($tapButton)}
                preset="default"
                onPress={resend}
                disabled={isResendDisabled}
            />
        </Screen>
    );
};

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
});

const $logIn: ThemedStyle<TextStyle> = ({ spacing }) => ({
    marginBottom: spacing.sm,
});

const $enterDetails: ThemedStyle<TextStyle> = ({ spacing }) => ({
    marginBottom: spacing.lg,
});

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    marginBottom: spacing.lg,
});

const $tapButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    marginTop: spacing.xs,
});
