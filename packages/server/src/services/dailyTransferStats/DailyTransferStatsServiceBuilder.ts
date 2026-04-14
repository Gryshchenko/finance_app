import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { DailyTransferStatsDataAccess } from 'services/dailyTransferStats/DailyTransferStatsDataAccess';
import { DailyTransferStatsService } from 'services/dailyTransferStats/DailyTransferStatsService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export class DailyTransferStatsServiceBuilder {
    static build(db?: IDatabaseConnection): DailyTransferStatsService {
        const database = db ?? DatabaseConnectionBuilder.build();
        return new DailyTransferStatsService(new DailyTransferStatsDataAccess(database));
    }
}
