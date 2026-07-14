import { useState } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IPendingConnectionRequest } from '@tenpercent/shared';

import { PendingRequestsList } from '@/components/sharing/PendingRequestsList';
import { useAppQuery, useInvalidateQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath, SettingsStackParamList } from '@/navigators/SettingsStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { fetchPendingRequests } from '@/screens/SharingScreens/sharingQueries';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { InvalidationGroups, QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { SharingService } from '@/services/SharingService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

type Props = NativeStackScreenProps<SettingsStackParamList, SettingsPath.PendingRequests>;

export const PendingRequestsScreen = function PendingRequestsScreen(_props: Props) {
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    const invalidateQuery = useInvalidateQuery();
    const [isProcessing, setIsProcessing] = useState(false);
    const { isError, data, isPending } = useAppQuery<IPendingConnectionRequest[] | undefined>(
        QueryKeys.sharingPendingRequests(),
        fetchPendingRequests,
        { staleTime: QueryStaleTimes.list },
    );

    const resolveRequest = async (connectionId: number, accepted: boolean) => {
        setIsProcessing(true);
        try {
            const service = SharingService.instance();
            const response = accepted
                ? await service.doAcceptRequest(connectionId)
                : await service.doDeclineRequest(connectionId);
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.info({
                    title: 'common:info',
                    message: accepted ? 'sharing:requestAccepted' : 'sharing:requestDeclined',
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
            name={translate('sharing:pendingTitle')}
            isError={isError}
            isPending={isPending}
            onBack={() => navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.Settings })}
            props={{
                data,
                isProcessing,
                onAccept: (connectionId: number) => resolveRequest(connectionId, true),
                onDecline: (connectionId: number) => resolveRequest(connectionId, false),
            }}
            RenderComponent={PendingRequestsList}
        />
    );
};
