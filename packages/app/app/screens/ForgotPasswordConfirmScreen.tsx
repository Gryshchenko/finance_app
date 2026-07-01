import { FC, useEffect, useRef, useState } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Time, Utils } from 'tenpercent/shared';

import { Button } from '@/components/buttons/Button';
import { TextButton } from '@/components/buttons/TextButton';
import { HeaderTitle } from '@/components/HeaderTitle';
import { OtpCodeInput } from '@/components/OtpCodeInput';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useEditView } from '@/hooks/useEditView';
import type { AppStackScreenProps } from '@/navigators/AppNavigator';
import { signUpConfirmationShema } from '@/schems/validationSchemas';
import { $timer } from '@/screens/SignUpConfirmationScreen';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { ForgotPasswordService } from '@/services/ForgotPasswordService';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { AppPath } from '@/types/AppPath';

interface Props extends AppStackScreenProps<AppPath.ForgotPasswordConfirm> {}

export const ForgotPasswordConfirmScreen: FC<Props> = (_props) => {
    const { route, navigation } = _props;
    const { email } = route.params;

    const { themed } = useAppTheme();
    const [resendTimer, setResendTimer] = useState(120);
    const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    const { form, handleChange, save, errors, setErrors, withFetching, isFetching } = useEditView<{
        confirmationCode: string;
    }>({ confirmationCode: '' }, signUpConfirmationShema);

    const clearTimer = () => {
        if (timerRef.current !== undefined) {
            clearInterval(timerRef.current);
            timerRef.current = undefined;
        }
    };

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

    const confirm = async () => {
        await withFetching(async () => {
            const service = ForgotPasswordService.instance();
            const response = await service.confirm(email, form.confirmationCode!);
            if (response.kind === GeneralApiProblemKind.Ok) {
                navigation.navigate({ name: AppPath.ForgotPasswordChange, params: undefined });
            } else if (response.kind === GeneralApiProblemKind.BadData) {
                handleBadDataResponse(response.errors, setErrors);
            } else {
                buildGeneralApiBaseHandler(response);
            }
        });
    };

    const handleConfirm = async () => {
        const isValid = await save();
        if (!isValid) return;
        await confirm();
    };

    const resend = async () => {
        await withFetching(async () => {
            clearTimer();
            const service = ForgotPasswordService.instance();
            const response = await service.refreshCode(email);
            if (response.kind === GeneralApiProblemKind.Ok) {
                handleChange('confirmationCode', '');
                startTimer();
            } else if (response.kind === GeneralApiProblemKind.BadData) {
                handleBadDataResponse(response.errors, setErrors);
            } else {
                buildGeneralApiBaseHandler(response);
            }
        });
    };

    return (
        <Screen preset="fixed" contentContainerStyle={themed($screenContentContainer)} safeAreaEdges={['top', 'bottom']}>
            <HeaderTitle subLogoText="forgotPasswordConfirmScreen:name" />
            <View style={$container}>
                <View style={$body}>
                    <Text tx="forgotPasswordConfirmScreen:description" style={themed($description)} />
                    <KeyboardAwareScrollView bottomOffset={62}>
                        <OtpCodeInput
                            value={form.confirmationCode ?? ''}
                            helperTx={errors?.confirmationCode}
                            status={errors?.confirmationCode ? 'error' : undefined}
                            onFinish={(code) => handleChange('confirmationCode', code)}
                        />
                    </KeyboardAwareScrollView>
                </View>
                {resendTimer > 0 && (
                    <View style={$timerRow}>
                        <Text tx="forgotPasswordConfirmScreen:timerHelper" style={themed($timerHelper)} />
                        <Text style={themed($timer)}>{Time.secondsToMinutes(resendTimer)}</Text>
                    </View>
                )}
                <Button
                    tx="forgotPasswordConfirmScreen:confirmButton"
                    style={themed($tapButton)}
                    preset="reversed"
                    disabled={
                        !Utils.isEmpty(errors?.confirmationCode as string) || Utils.isEmpty(form.confirmationCode) || isFetching
                    }
                    onPress={handleConfirm}
                />
                <TextButton
                    tx="forgotPasswordConfirmScreen:resendButton"
                    style={themed($tapButton)}
                    preset="reversed"
                    disabled={resendTimer > 0 || isFetching}
                    onPress={resend}
                />
                <TextButton
                    tx="common:back"
                    style={themed($tapButton)}
                    onPress={() => navigation.navigate({ name: AppPath.ForgotPasswordRequest, params: undefined })}
                />
            </View>
        </Screen>
    );
};

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    flex: 1,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
});

const $container: ViewStyle = {
    flex: 1,
};

const $body: ViewStyle = {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '20%',
};

const $timerRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
};

const $description: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
    fontSize: 14,
    fontFamily: typography.primary.medium,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
});

const $timerHelper: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    color: colors.textDim,
    fontSize: 14,
    fontFamily: typography.primary.medium,
});

const $tapButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    marginTop: spacing.xs,
    width: '100%',
});
