import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { DailyCategoryStatsDataAccess } from 'services/dailyCategoryStats/DailyCategoryStatsDataAccess';
import { DailyCategoryStatsService } from 'services/dailyCategoryStats/DailyCategoryStatsService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export class DailyCategoryStatsServiceBuilder {
    static build(db?: IDatabaseConnection): DailyCategoryStatsService {
        const database = db ?? DatabaseConnectionBuilder.build();
        return new DailyCategoryStatsService(new DailyCategoryStatsDataAccess(database));
    }
}
