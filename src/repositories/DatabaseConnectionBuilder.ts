import DatabaseConnection from 'src/repositories/DatabaseConnection';
import config from 'src/config/dbConfig';

export default class DatabaseConnectionBuilder {
    public static build() {
        return new DatabaseConnection(config);
    }
}
