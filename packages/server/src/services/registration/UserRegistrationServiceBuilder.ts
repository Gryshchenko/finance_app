import AccountServiceBuilder from 'services/account/AccountServiceBuilder';
import BalanceServiceBuilder from 'services/balance/BalanceServiceBuilder';
import CategoryServiceBuilder from 'services/category/CategoryServiceBuilder';
import CurrencyServiceBuilder from 'services/currency/CurrencyServiceBuilder';
import EmailConfirmationServiceBuilder from 'services/emailConfirmation/EmailConfirmationServiceBuilder';
import GroupServiceBuilder from 'services/group/GroupServiceBuilder';
import IncomeServiceBuilder from 'services/income/IncomeServiceBuilder';
import ProfileServiceBuilder from 'services/profile/ProfileServiceBuilder';
import UserRoleServiceBuilder from 'services/userRole/UserRoleServiceBuilder';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import { KeyValueStoreBuilder } from 'src/repositories/keyValueStore/KeyValueStoreBuilder';
import UserRegistrationService from 'src/services/registration/UserRegistrationService';
import UserServiceBuilder from 'src/services/user/UserServiceBuilder';

export default class UserRegistrationServiceBuilder {
    public static build() {
        const databaseConnection = DatabaseConnectionBuilder.build();
        return new UserRegistrationService({
            userService: UserServiceBuilder.build(),
            accountService: AccountServiceBuilder.build(),
            categoryService: CategoryServiceBuilder.build(),
            groupService: GroupServiceBuilder.build(),
            incomeService: IncomeServiceBuilder.build(),
            userRoleService: UserRoleServiceBuilder.build(),
            profileService: ProfileServiceBuilder.build(),
            currencyService: CurrencyServiceBuilder.build(),
            balanceService: BalanceServiceBuilder.build(),
            keyValueStore: KeyValueStoreBuilder.build(),
            emailConfirmationService: EmailConfirmationServiceBuilder.build(),
            db: databaseConnection,
        });
    }
}
