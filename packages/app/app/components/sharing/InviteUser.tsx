import { FC } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';

import { InviteUserFields, InviteUserForm } from '@/components/sharing/InviteUserFields';
import { useEditView } from '@/hooks/useEditView';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath } from '@/navigators/SettingsStackNavigator';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { SharingService } from '@/services/SharingService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const InviteUser: FC<{ data?: unknown }> = function InviteUser() {
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    const { form, handleChange, errors, setErrors, isFetching, withFetching } = useEditView<InviteUserForm>({});

    const goBack = () => navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.ConnectedUsers });

    const handleSave = async () => {
        const email = (form.email ?? '').trim();
        if (!email) {
            setErrors({ email: 'validation:emailRequired' });
            return;
        }
        if (!EMAIL_RE.test(email)) {
            setErrors({ email: 'validation:email' });
            return;
        }
        if (form.userGroupId == null) {
            setErrors({ userGroupId: 'validation:valueRequired' });
            return;
        }
        await withFetching(async () => {
            const response = await SharingService.instance().doInviteUser({
                email,
                userGroupId: form.userGroupId!,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.info({
                    title: 'common:info',
                    message: 'sharing:inviteSuccess',
                });
                goBack();
            } else if (response.kind === GeneralApiProblemKind.BadData) {
                handleBadDataResponse(response.errors, setErrors);
            } else {
                buildGeneralApiBaseHandler(response);
            }
        });
    };

    return (
        <InviteUserFields
            form={form}
            errors={errors}
            isSaveDisabled={isFetching}
            handleChange={(key, value) => handleChange(key, value as never)}
            handleSave={handleSave}
            onCancel={goBack}
        />
    );
};
