import ConnectionServiceBuilder from 'services/connection/ConnectionServiceBuilder';
import GroupServiceBuilder from 'services/group/GroupServiceBuilder';
import { SharingOrchestrationService } from 'services/sharingOrchestrator/SharingOrchestrationService';
import UserServiceBuilder from 'services/user/UserServiceBuilder';

export class SharingOrchestrationServiceBuilder {
    public static build(): SharingOrchestrationService {
        return new SharingOrchestrationService({
            connectionService: ConnectionServiceBuilder.build(),
            groupService: GroupServiceBuilder.build(),
            userService: UserServiceBuilder.build(),
        });
    }
}
