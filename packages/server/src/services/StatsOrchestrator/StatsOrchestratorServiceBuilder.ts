import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import CategoryServiceBuilder from 'services/category/CategoryServiceBuilder';
import { CurrencyOrchestratorServiceBuilder } from 'services/currencyOrchestrator/CurrencyOrchestratorServiceBuilder';
import IncomeServiceBuilder from 'services/income/IncomeServiceBuilder';
import ProfileServiceBuilder from 'services/profile/ProfileServiceBuilder';
import StatsOrchestratorService from 'services/StatsOrchestrator/StatsOrchestratorService';
import TransactionServiceBuilder from 'services/transaction/TransactionServiceBuilder';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export class StatsOrchestratorServiceBuilder {
    static build(db?: IDatabaseConnection): StatsOrchestratorService {
        const database = db ?? DatabaseConnectionBuilder.build();

        return new StatsOrchestratorService({
            categoryService: CategoryServiceBuilder.build(database),
            incomeService: IncomeServiceBuilder.build(database),
            transactionsService: TransactionServiceBuilder.build(database),
            currencyOrchestratorService: CurrencyOrchestratorServiceBuilder.build(database),
            profileService: ProfileServiceBuilder.build(database),
        });
    }
}
