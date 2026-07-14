import { FC } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';

import { GroupFields, GroupForm } from '@/components/sharing/GroupFields';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath } from '@/navigators/SettingsStackNavigator';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { InvalidationGroups } from '@/services/QueryCacheService';
import { ShareGroupService } from '@/services/ShareGroupService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

const EMPTY_GROUP: GroupForm = {
    groupName: '',
    description: '',
};

export const CreateGroup: FC<{ data?: unknown }> = function CreateGroup() {
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, errors, setErrors, isFetching, withFetching } = useEditView<GroupForm>(EMPTY_GROUP);

    const goBack = () => navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.Groups });

    const handleSave = async () => {
        const groupName = (form.groupName ?? '').trim();
        if (!groupName) {
            setErrors({ groupName: 'validation:required' });
            return;
        }
        await withFetching(async () => {
            const response = await ShareGroupService.instance().doCreateGroup({
                groupName,
                description: form.description?.trim() || undefined,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.info({
                    title: 'common:info',
                    message: 'sharing:createGroupSuccess',
                });
                await invalidateQuery(InvalidationGroups.sharingGroups());
                goBack();
            } else if (response.kind === GeneralApiProblemKind.BadData) {
                handleBadDataResponse(response.errors, setErrors);
            } else {
                buildGeneralApiBaseHandler(response);
            }
        });
    };

    return (
        <GroupFields
            form={form as GroupForm}
            errors={errors}
            isCreate
            isSaveDisabled={isFetching}
            handleChange={(key, value) => handleChange(key, value)}
            handleSave={handleSave}
            onCancel={goBack}
        />
    );
};
