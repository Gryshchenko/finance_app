import { FC } from 'react';
import { View, ViewStyle, TextStyle } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Utils } from 'tenpercent/shared';

import { EditButtons } from '@/components/buttons/EditButtons';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { useEditView } from '@/hooks/useEditView';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath } from '@/navigators/SettingsStackNavigator';
import { settingsChangeEmailShema } from '@/schems/validationSchemas';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, parseServerErrors } from '@/services/api/apiProblem';
import { ChangeEmailService } from '@/services/ChangeEmailService';
import ToastService from '@/services/ToastService';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { OverviewPath } from '@/types/OverviewPath';

interface Props {
    email: string;
    originEmail: string;
}

export const SettingsChangeEmail: FC<Props> = function SettingsChangeEmail(props) {
    const { email, originEmail } = props;
    const { themed } = useAppTheme();
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    const { form, handleChange, save, errors, setErrors } = useEditView<Partial<{ email: string }>>(
        { email: email },
        settingsChangeEmailShema,
    );

    const handlePatch = async () => {
        const changeEmailService = ChangeEmailService.instance();
        if (Utils.isEmpty(form.email)) return setErrors({ email: 'validation:valueRequired' });
        if (form.email === originEmail) return setErrors({ email: 'validation:sameEmail' });

        const response = await changeEmailService.request(form.email!);
        if (response.kind === GeneralApiProblemKind.Ok) {
            navigation.navigate(OverviewPath.Settings, {
                screen: SettingsPath.ChangeEmailConfirm,
                params: { email: form.email!, originEmail },
            });
        } else if (response.kind === GeneralApiProblemKind.BadData) {
            const { fieldErrors, hasNonFieldErrors } = parseServerErrors(response.errors);
            if (Object.keys(fieldErrors).length > 0) {
                setErrors(fieldErrors as any);
            }
            if (hasNonFieldErrors) {
                ToastService.error({ title: 'common:error', message: 'settingsChangeEmailScreen:updateFailed' });
            }
        } else {
            buildGeneralApiBaseHandler(response);
        }
    };

    const handleSave = async () => {
        const isValid = await save();
        if (!isValid) return;
        await handlePatch();
    };

    return (
        <View style={$container}>
            <Text tx="settingsChangeEmailScreen:description" style={themed($description)} />
            <TextField
                preset={'underline'}
                focusOnMount={true}
                labelTx={'settingsChangeEmailScreen:input'}
                value={String(form.email)}
                helperTx={errors?.email}
                status={errors?.email ? 'error' : undefined}
                editable={true}
                onChangeText={(v) => {
                    if (handleChange) {
                        handleChange('email', v);
                    }
                }}
            />
            <View style={$spacer} />
            <EditButtons
                isCreate={false}
                isView={false}
                onSave={handleSave}
                onCancel={() => {
                    navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.Settings });
                }}
            />
        </View>
    );
};

const $container: ViewStyle = {
    flex: 1,
};

const $spacer: ViewStyle = {
    flex: 1,
};

const $description: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
    fontSize: 14,
    fontFamily: typography.primary.medium,
    color: colors.textDim,
    lineHeight: 20,
    marginBottom: spacing.lg,
});
