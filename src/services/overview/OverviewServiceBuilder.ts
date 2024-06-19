import AccountServiceBuilder from 'services/account/AccountServiceBuilder';
import CategoryServiceBuilder from 'services/category/CategoryServiceBuilder';
import IncomeServiceBuilder from 'services/income/IncomeServiceBuilder';
import OverviewService from 'services/overview/OverviewService';

export default class OverviewServiceBuilder {
    public static build() {
        return new OverviewService({
            accountService: AccountServiceBuilder.build(),
            categoryService: CategoryServiceBuilder.build(),
            incomeService: IncomeServiceBuilder.build(),
        });
    }
}
