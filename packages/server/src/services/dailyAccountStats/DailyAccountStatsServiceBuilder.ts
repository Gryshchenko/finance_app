import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { DailyAccountStatsDataAccess } from 'services/dailyAccountStats/DailyAccountStatsDataAccess';
import { DailyAccountStatsService } from 'services/dailyAccountStats/DailyAccountStatsService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export class DailyAccountStatsServiceBuilder {
    static build(db?: IDatabaseConnection): DailyAccountStatsService {
        const database = db ?? DatabaseConnectionBuilder.build();
        return new DailyAccountStatsService(new DailyAccountStatsDataAccess(database));
    }
}
