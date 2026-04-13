import UserRegistrationService from 'src/services/registration/UserRegistrationService';
import UserServiceBuilder from 'src/services/user/UserServiceBuilder';
import AccountServiceBuilder from 'services/account/AccountServiceBuilder';
import CategoryServiceBuilder from 'services/category/CategoryServiceBuilder';
import GroupServiceBuilder from 'services/group/GroupServiceBuilder';
import IncomeServiceBuilder from 'services/income/IncomeServiceBuilder';
import UserRoleServiceBuilder from 'services/userRole/UserRoleServiceBuilder';
import ProfileServiceBuilder from 'services/profile/ProfileServiceBuilder';
import CurrencyServiceBuilder from 'services/currency/CurrencyServiceBuilder';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import BalanceServiceBuilder from 'services/balance/BalanceServiceBuilder';
import { KeyValueStoreBuilder } from 'src/repositories/keyValueStore/KeyValueStoreBuilder';
import EmailConfirmationServiceBuilder from 'services/emailConfirmation/EmailConfirmationServiceBuilder';

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
