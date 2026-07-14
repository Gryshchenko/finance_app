import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import ConnectionDataAccess from 'services/connection/ConnectionDataAccess';
import ConnectionService from 'services/connection/ConnectionService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class ConnectionServiceBuilder {
    public static build(db?: IDatabaseConnection) {
        const databaseConnection = db ?? DatabaseConnectionBuilder.build();
        return new ConnectionService(new ConnectionDataAccess(databaseConnection));
    }
}
