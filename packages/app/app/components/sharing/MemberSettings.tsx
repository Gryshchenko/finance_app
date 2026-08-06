import { FC } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { IConnectedMember } from '@tenpercent/shared';

import { EmptyState } from '@/components/EmptyState';
import { MemberFields, MemberForm } from '@/components/sharing/MemberFields';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { useHeaderRightAction } from '@/hooks/useHeaderRightAction';
import { translate } from '@/i18n/translate';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath } from '@/navigators/SettingsStackNavigator';
import AlertService from '@/services/AlertService';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { InvalidationGroups } from '@/services/QueryCacheService';
import { SharingService } from '@/services/SharingService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

export const MemberSettings: FC<{ data: IConnectedMember | undefined }> = function MemberSettings({ data }) {
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, isFetching, withFetching } = useEditView<MemberForm>(
        {
            userGroupId: data?.userGroupId,
        },
        undefined,
        String(data?.connectionId),
    );

    const goBack = () => navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.ConnectedUsers });

    const handleSave = async () => {
        if (!data || form.userGroupId == null) return;
        await withFetching(async () => {
            const response = data.isOwner
                ? await SharingService.instance().doPatchOwnerGroup(data.connectionId, form.userGroupId!)
                : await SharingService.instance().doPatchMemberGroup(data.connectionId, form.userGroupId!);
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.info({
                    title: 'common:info',
                    message: 'sharing:memberUpdateSuccess',
                });
                await invalidateQuery(InvalidationGroups.sharingConnections());
                goBack();
            } else {
                buildGeneralApiBaseHandler(response);
            }
        });
    };

    const handleRemove = async () => {
        if (!data) return;
        await withFetching(async () => {
            const response = await SharingService.instance().doDeleteMember(data.connectionId);
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.info({
                    title: 'common:info',
                    message: 'sharing:memberRemoveSuccess',
                });
                await invalidateQuery(InvalidationGroups.sharingConnections());
                goBack();
            } else {
                buildGeneralApiBaseHandler(response);
            }
        });
    };

    const onDelete = () => {
        AlertService.prompt(translate('sharing:removeMemberTitle'), translate('sharing:removeMemberMessage'), [
            { text: translate('sharing:removeMember'), style: 'destructive', onPress: () => handleRemove() },
            { text: translate('common:cancel'), style: 'cancel' },
        ]);
    };

    useHeaderRightAction(data ? onDelete : undefined, { disabled: isFetching });

    if (!data) {
        return <EmptyState buttonOnPress={goBack} />;
    }

    return (
        <MemberFields
            user={data}
            form={form as MemberForm}
            isSaveDisabled={isFetching || form.userGroupId == null}
            handleChange={handleChange}
            handleSave={handleSave}
        />
    );
};
