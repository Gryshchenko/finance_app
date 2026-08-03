import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import ConnectionOwnerDataAccess from 'services/connection/ConnectionOwnerDataAccess';
import ConnectionOwnerService from 'services/connection/ConnectionOwnerService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class ConnectionOwnerServiceBuilder {
    public static build(db?: IDatabaseConnection) {
        const databaseConnection = db ?? DatabaseConnectionBuilder.build();
        return new ConnectionOwnerService(new ConnectionOwnerDataAccess(databaseConnection));
    }
}
