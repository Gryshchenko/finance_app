import config from 'src/config/dbConfig';
import DatabaseConnection from 'src/repositories/DatabaseConnection';

export default class DatabaseConnectionBuilder {
    public static build() {
        return DatabaseConnection.instance(config);
    }
}
