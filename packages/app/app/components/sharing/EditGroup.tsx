import { FC } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { IConnectedMember, IShareGroup } from '@tenpercent/shared';

import { EmptyState } from '@/components/EmptyState';
import { GroupFields, GroupForm } from '@/components/sharing/GroupFields';
import { useAppQuery, useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { useHeaderRightAction } from '@/hooks/useHeaderRightAction';
import { translate } from '@/i18n/translate';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath } from '@/navigators/SettingsStackNavigator';
import { fetchConnections } from '@/screens/SharingScreens/sharingQueries';
import AlertService from '@/services/AlertService';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { InvalidationGroups, QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { ShareGroupService } from '@/services/ShareGroupService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

export const EditGroup: FC<{ data?: IShareGroup }> = function EditGroup({ data }) {
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, errors, setErrors, isFetching, withFetching } = useEditView<GroupForm>(
        {
            groupName: data?.groupName ?? '',
            description: data?.description ?? '',
        },
        undefined,
        String(data?.userGroupId),
    );
    const { data: connections } = useAppQuery<IConnectedMember[] | undefined>(QueryKeys.sharingConnections(), fetchConnections, {
        staleTime: QueryStaleTimes.list,
    });
    const members = connections?.filter((member) => member.userGroupId === data?.userGroupId) ?? [];

    const goBack = () => navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.Groups });
    const goToMember = (connectionId: number) =>
        navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.MemberSettings, params: { connectionId } });

    const handleSave = async () => {
        if (!data) return;
        const groupName = (form.groupName ?? '').trim();
        if (!groupName) {
            setErrors({ groupName: 'validation:required' });
            return;
        }
        await withFetching(async () => {
            const response = await ShareGroupService.instance().doPatchGroup(data.userGroupId, {
                groupName,
                description: form.description?.trim() || undefined,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.info({
                    title: 'common:info',
                    message: 'sharing:updateGroupSuccess',
                });
                await invalidateQuery(InvalidationGroups.sharingGroups(data.userGroupId));
                goBack();
            } else if (response.kind === GeneralApiProblemKind.BadData) {
                handleBadDataResponse(response.errors, setErrors);
            } else {
                buildGeneralApiBaseHandler(response);
            }
        });
    };

    const handleDelete = async () => {
        if (!data) return;
        await withFetching(async () => {
            const response = await ShareGroupService.instance().doDeleteGroup(data.userGroupId);
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.info({
                    title: 'common:info',
                    message: 'sharing:deleteGroupSuccess',
                });
                await invalidateQuery(InvalidationGroups.sharingGroups(data.userGroupId));
                goBack();
            } else {
                buildGeneralApiBaseHandler(response);
            }
        });
    };

    const onDelete = () => {
        AlertService.prompt(translate('sharing:deleteGroupTitle'), translate('sharing:deleteGroupMessage'), [
            { text: translate('common:delete'), style: 'destructive', onPress: () => handleDelete() },
            { text: translate('common:cancel'), style: 'cancel' },
        ]);
    };

    useHeaderRightAction(data ? onDelete : undefined, { disabled: isFetching });

    if (!data) {
        return <EmptyState buttonOnPress={goBack} />;
    }

    return (
        <GroupFields
            form={form as GroupForm}
            errors={errors}
            isCreate={false}
            members={members}
            onPressMember={goToMember}
            isSaveDisabled={isFetching}
            handleChange={(key, value) => handleChange(key, value)}
            handleSave={handleSave}
        />
    );
};
