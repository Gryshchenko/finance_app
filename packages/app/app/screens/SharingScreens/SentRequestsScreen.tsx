import { useState } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ISentConnectionRequest } from '@tenpercent/shared';

import { SentRequestsList } from '@/components/sharing/SentRequestsList';
import { useAppQuery, useInvalidateQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath, SettingsStackParamList } from '@/navigators/SettingsStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { fetchSentRequests } from '@/screens/SharingScreens/sharingQueries';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { InvalidationGroups, QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { SharingService } from '@/services/SharingService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

type Props = NativeStackScreenProps<SettingsStackParamList, SettingsPath.SentRequests>;

export const SentRequestsScreen = function SentRequestsScreen(_props: Props) {
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    const invalidateQuery = useInvalidateQuery();
    const [isProcessing, setIsProcessing] = useState(false);
    const { isError, data, isPending } = useAppQuery<ISentConnectionRequest[] | undefined>(
        QueryKeys.sharingSentRequests(),
        fetchSentRequests,
        { staleTime: QueryStaleTimes.list },
    );

    const cancelRequest = async (connectionId: number) => {
        setIsProcessing(true);
        try {
            const service = SharingService.instance();
            const response = await service.doDeleteMember(connectionId);
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.info({
                    title: 'common:info',
                    message: 'sharing:requestCancelled',
                });
                await invalidateQuery(InvalidationGroups.sharingConnections());
            } else {
                buildGeneralApiBaseHandler(response);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <GenericListScreen
            name={translate('sharing:sentTitle')}
            isError={isError}
            isPending={isPending}
            onBack={() => navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.Settings })}
            props={{
                data,
                isProcessing,
                onCancel: (connectionId: number) => cancelRequest(connectionId),
            }}
            RenderComponent={SentRequestsList}
        />
    );
};
