import ProfileDataAccess from 'src/services/profile/ProfileDataAccess';
import ProfileService from './ProfileService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class ProfileServiceBuilder {
    public static build() {
        return new ProfileService(new ProfileDataAccess(DatabaseConnectionBuilder.build()));
    }
}
