import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { DailyAccountStatsServiceBuilder } from 'services/dailyAccountStats/DailyAccountStatsServiceBuilder';
import { DailyCategoryStatsServiceBuilder } from 'services/dailyCategoryStats/DailyCategoryStatsServiceBuilder';
import { DailyIncomeStatsServiceBuilder } from 'services/dailyIncomeStats/DailyIncomeStatsServiceBuilder';
import DailyStatsServiceBuilder from 'services/dailyStats/DailyStatsServiceBuilder';
import { DailyTransferStatsServiceBuilder } from 'services/dailyTransferStats/DailyTransferStatsServiceBuilder';
import StatsOrchestratorService from 'services/StatsOrchestrator/StatsOrchestratorService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export class StatsOrchestratorServiceBuilder {
    static build(db?: IDatabaseConnection): StatsOrchestratorService {
        const database = db ?? DatabaseConnectionBuilder.build();

        return new StatsOrchestratorService({
            dailyStatsService: DailyStatsServiceBuilder.build(database),
            dailyCategoryStatsService: DailyCategoryStatsServiceBuilder.build(database),
            dailyAccountStatsService: DailyAccountStatsServiceBuilder.build(database),
            dailyIncomeStatsService: DailyIncomeStatsServiceBuilder.build(database),
            dailyTransferStatsService: DailyTransferStatsServiceBuilder.build(database),
        });
    }
}
