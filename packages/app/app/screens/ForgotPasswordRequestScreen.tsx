import { FC } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { TextButton } from '@/components/buttons/TextButton';
import { HeaderTitle } from '@/components/HeaderTitle';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { useEditView } from '@/hooks/useEditView';
import type { AppStackScreenProps } from '@/navigators/AppNavigator';
import { forgotPasswordRequestSchema } from '@/schems/validationSchemas';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { ForgotPasswordService } from '@/services/ForgotPasswordService';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { AppPath } from '@/types/AppPath';

interface Props extends AppStackScreenProps<AppPath.ForgotPasswordRequest> {}

export const ForgotPasswordRequestScreen: FC<Props> = (_props) => {
    const { navigation } = _props;

    const { form, handleChange, save, errors, setErrors, withFetching, isFetching } = useEditView<{
        email: string;
    }>({ email: '' }, forgotPasswordRequestSchema);

    const { themed } = useAppTheme();

    function goBack() {
        navigation.navigate({ name: AppPath.Login, params: undefined });
    }

    async function request() {
        const isValid = await save();
        if (!isValid) return;

        await withFetching(async () => {
            const service = ForgotPasswordService.instance();
            const response = await service.request(form.email!);

            if (response.kind === GeneralApiProblemKind.Ok) {
                navigation.navigate({
                    name: AppPath.ForgotPasswordConfirm,
                    params: {
                        email: form.email!,
                    },
                });
            } else if (response.kind === GeneralApiProblemKind.BadData) {
                handleBadDataResponse(response.errors, setErrors, new Set(['email']));
            } else {
                buildGeneralApiBaseHandler(response);
            }
        });
    }

    return (
        <Screen preset="fixed" contentContainerStyle={themed($screenContentContainer)} safeAreaEdges={['top', 'bottom']}>
            <HeaderTitle subLogoText="forgotPasswordRequestScreen:name" />
            <Text tx="forgotPasswordRequestScreen:description" style={themed($description)} />
            <View style={$container}>
                <TextField
                    value={String(form.email)}
                    onChangeText={(v) => handleChange('email', v)}
                    containerStyle={themed($textField)}
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    keyboardType="email-address"
                    labelTx="forgotPasswordRequestScreen:emailInput"
                    placeholderTx="common:emailFieldPlaceholder"
                    helperTx={errors.email}
                    status={errors.email ? 'error' : undefined}
                />
                <View style={$spacer} />
                <Button
                    testID="signUp-button"
                    tx="common:continue"
                    style={themed($tapButton)}
                    preset="reversed"
                    disabled={isFetching}
                    onPress={request}
                />
                <TextButton testID="back-button" tx="common:back" style={themed($tapButton)} onPress={goBack} />
            </View>
        </Screen>
    );
};

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    flex: 1,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
});

const $textField: ThemedStyle<ViewStyle> = () => ({
    marginBottom: 0,
});

const $tapButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    marginTop: spacing.xs,
});

const $spacer: ViewStyle = {
    flex: 1,
};

const $container: ViewStyle = {
    flex: 1,
};
const $description: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
    fontSize: 14,
    fontFamily: typography.primary.medium,
    color: colors.textDim,
    lineHeight: 20,
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
});
