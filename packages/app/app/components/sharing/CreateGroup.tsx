import { FC } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { IGroupSharedItem } from '@tenpercent/shared';

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

const arrayToObject = (items: IGroupSharedItem[]) => {
    const result: Record<string, IGroupSharedItem> = {};
    items.forEach((item) => {
        result[item.id] = item;
    });
    return result;
};

export const CreateGroup: FC<{ data?: IGroupSharedItem[] }> = function CreateGroup({ data }) {
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, errors, setErrors, isFetching, withFetching } = useEditView<GroupForm>({
        groupName: '',
        description: '',
        incomes: arrayToObject(data?.filter((item) => item.type === 'income') ?? []),
        accounts: arrayToObject(data?.filter((item) => item.type === 'account') ?? []),
        categories: arrayToObject(data?.filter((item) => item.type === 'category') ?? []),
    });

    const goBack = () => navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.Groups });

    const handleSave = async () => {
        const groupName = (form.groupName ?? '').trim();
        if (!groupName) {
            setErrors({ groupName: 'validation:required' });
            return;
        }
        const groupSharedItems = [
            ...Object.values(form.incomes ?? {}),
            ...Object.values(form.accounts ?? {}),
            ...Object.values(form.categories ?? {}),
        ];
        await withFetching(async () => {
            const response = await ShareGroupService.instance().doCreateGroup({
                groupName,
                description: form.description?.trim() || undefined,
                groupSharedItems,
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
