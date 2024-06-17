import DatabaseConnection from 'src/repositories/DatabaseConnection';
import ProfileDataAccess from 'src/services/profile/ProfileDataAccess';
import config from 'src/config/dbConfig';
import ProfileService from './ProfileService';

export default class ProfileServiceBuilder {
    public static build() {
        const databaseConnection = new DatabaseConnection(config);
        return new ProfileService(new ProfileDataAccess(databaseConnection));
    }
}
