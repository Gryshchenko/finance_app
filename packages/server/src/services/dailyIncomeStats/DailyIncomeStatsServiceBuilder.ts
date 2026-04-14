import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { DailyIncomeStatsDataAccess } from 'services/dailyIncomeStats/DailyIncomeStatsDataAccess';
import { DailyIncomeStatsService } from 'services/dailyIncomeStats/DailyIncomeStatsService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export class DailyIncomeStatsServiceBuilder {
    static build(db?: IDatabaseConnection): DailyIncomeStatsService {
        const database = db ?? DatabaseConnectionBuilder.build();
        return new DailyIncomeStatsService(new DailyIncomeStatsDataAccess(database));
    }
}
