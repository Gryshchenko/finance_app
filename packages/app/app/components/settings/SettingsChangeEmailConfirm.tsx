import { FC, useEffect, useRef, useState } from 'react';
import { View, ViewStyle, TextStyle } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Time, Utils } from '@tenpercent/shared';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Button } from '@/components/buttons/Button';
import { TextButton } from '@/components/buttons/TextButton';
import { OtpCodeInput } from '@/components/OtpCodeInput';
import { Text } from '@/components/Text';
import { useEditView } from '@/hooks/useEditView';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath } from '@/navigators/SettingsStackNavigator';
import { settingsChangeEmailConfirmationShema } from '@/schems/validationSchemas';
import { $timer } from '@/screens/SignUpConfirmationScreen';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { ChangeEmailService } from '@/services/ChangeEmailService';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { OverviewPath } from '@/types/OverviewPath';

interface Props {
    email: string;
    originEmail: string;
}

export const SettingsChangeEmailConfirmation: FC<Props> = function SettingsChangeEmailConfirmation({ email, originEmail }) {
    const { themed } = useAppTheme();
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();

    const [resendTimer, setResendTimer] = useState(120);
    const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

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

    const { form, handleChange, save, errors, setErrors, withFetching, isFetching } = useEditView<
        Partial<{ confirmationCode: string }>
    >({ confirmationCode: '' }, settingsChangeEmailConfirmationShema);

    const confirm = async () => {
        await withFetching(async () => {
            const changeEmailService = ChangeEmailService.instance();
            const response = await changeEmailService.confirm(Number(form.confirmationCode), email);
            if (response.kind === GeneralApiProblemKind.Ok) {
                navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.Settings });
            } else if (response.kind === GeneralApiProblemKind.BadData) {
                handleBadDataResponse(response.errors, setErrors);
            } else {
                buildGeneralApiBaseHandler(response);
            }
        });
    };

    const refresh = async () => {
        await withFetching(async () => {
            clearTimer();
            const changeEmailService = ChangeEmailService.instance();
            const response = await changeEmailService.refreshCode(email);
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

    const handleSave = async () => {
        const isValid = await save();
        if (!isValid) return;
        await confirm();
    };

    return (
        <View style={$container}>
            <View style={$body}>
                <Text tx="settingsChangeEmailConfirmScreen:description" style={themed($description)} />
                <KeyboardAwareScrollView bottomOffset={62}>
                    <OtpCodeInput
                        value={form?.confirmationCode ?? ''}
                        helperTx={errors?.confirmationCode}
                        status={errors?.confirmationCode ? 'error' : undefined}
                        onFinish={async (code: string) => {
                            handleChange('confirmationCode', code);
                        }}
                    />
                </KeyboardAwareScrollView>
            </View>
            {resendTimer > 0 && (
                <View style={$timerRow}>
                    <Text tx="settingsChangeEmailConfirmScreen:timerHelper" style={themed($timerHelper)} />
                    <Text style={themed($timer)}>{Time.secondsToMinutes(resendTimer)}</Text>
                </View>
            )}
            <Button
                tx="settingsChangeEmailConfirmScreen:confirmButton"
                style={themed($tapButton)}
                preset={'reversed'}
                disabled={
                    !Utils.isEmpty(errors?.confirmationCode as string) ||
                    Utils.isEmpty(form?.confirmationCode as string) ||
                    isFetching
                }
                onPress={handleSave}
            />
            <Button
                tx="common:back"
                style={themed($tapButton)}
                preset={'reversed'}
                onPress={() => {
                    navigation.navigate(OverviewPath.Settings, {
                        screen: SettingsPath.ChangeEmail,
                        params: {
                            email,
                            originEmail,
                        },
                    });
                }}
            />
            <TextButton
                tx={'settingsChangeEmailConfirmScreen:resendButton'}
                style={themed($tapButton)}
                onPress={refresh}
                preset={'reversed'}
                disabled={resendTimer > 0 || isFetching}
            />
        </View>
    );
};

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
    display: 'flex',
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
