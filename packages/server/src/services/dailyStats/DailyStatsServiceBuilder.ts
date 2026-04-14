import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import DailyStatsDataAccess from 'services/dailyStats/DailyStatsDataAccess';
import DailyStatsService from 'services/dailyStats/DailyStatsService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class DailyStatsServiceBuilder {
    public static build(db?: IDatabaseConnection): DailyStatsService {
        const databaseConnection = db ?? DatabaseConnectionBuilder.build();
        return new DailyStatsService(new DailyStatsDataAccess(databaseConnection));
    }
}
