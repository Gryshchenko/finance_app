import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import EmailChangingServiceBuilder from 'src/services/emailChanging/EmailChangingServiceBuilder';
import PasswordChangingServiceBuilder from 'src/services/passwordChanging/PasswordChangingServiceBuilder';
import ProfileDataAccess from 'src/services/profile/ProfileDataAccess';

import ProfileService from './ProfileService';

export default class ProfileServiceBuilder {
    public static build(db = DatabaseConnectionBuilder.build()) {
        return new ProfileService(
            new ProfileDataAccess(db),
            EmailChangingServiceBuilder.build(),
            PasswordChangingServiceBuilder.build(),
        );
    }
}
