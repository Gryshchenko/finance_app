import { FC } from 'react';
import { View, ViewStyle, TextStyle } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Utils } from '@tenpercent/shared';

import { EditButtons } from '@/components/buttons/EditButtons';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath } from '@/navigators/SettingsStackNavigator';
import { settingsChangePublicNameShema } from '@/schems/validationSchemas';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { ProfileService } from '@/services/ProfileService';
import { InvalidationGroups } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { OverviewPath } from '@/types/OverviewPath';

interface Props {
    publicName: string | undefined;
}

export const SettingsChangePublicName: FC<Props> = function SettingsChangePublicName(props) {
    const { publicName } = props;
    const { themed } = useAppTheme();
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, save, errors, setErrors, withFetching, isFetching } = useEditView<
        Partial<{ publicName: string }>
    >({ publicName }, settingsChangePublicNameShema);

    const handlePatch = async () => {
        await withFetching(async () => {
            const profileService = ProfileService.instance();
            if (Utils.isEmpty(form.publicName)) return;

            const response = await profileService.doPatchProfile({
                publicName: form.publicName!,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.info({
                    title: 'common:info',
                    message: 'settingsChangePublicNameScreen:updateSuccess',
                });
                await invalidateQuery(InvalidationGroups.profile());
                navigation.goBack();
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
        await handlePatch();
    };

    return (
        <View style={$container}>
            <Text tx="settingsChangePublicNameScreen:description" style={themed($description)} />
            <TextField
                preset={'underline'}
                focusOnMount={true}
                labelTx={'settingsChangePublicNameScreen:input'}
                value={String(form.publicName)}
                helperTx={errors?.publicName}
                status={errors?.publicName ? 'error' : undefined}
                editable={true}
                onChangeText={(v) => {
                    if (handleChange) {
                        handleChange('publicName', v);
                    }
                }}
            />
            <View style={$spacer} />
            <EditButtons
                isCreate={false}
                isView={false}
                isSaveDisabled={isFetching}
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
