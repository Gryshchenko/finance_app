import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import ConnectionMemberDataAccess from 'services/connection/ConnectionMemberDataAccess';
import ConnectionMemberService from 'services/connection/ConnectionMemberService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class ConnectionMemberServiceBuilder {
    public static build(db?: IDatabaseConnection) {
        const databaseConnection = db ?? DatabaseConnectionBuilder.build();
        return new ConnectionMemberService(new ConnectionMemberDataAccess(databaseConnection));
    }
}
