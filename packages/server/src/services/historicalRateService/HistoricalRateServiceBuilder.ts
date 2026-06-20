import HistoricalRateDataAccess from 'services/historicalRateService/HistoricalRateDataAccess';
import HistoricalRateService from 'services/historicalRateService/HistoricalRateService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class HistoricalRateServiceBuilder {
    public static build(db = DatabaseConnectionBuilder.build()) {
        return new HistoricalRateService(new HistoricalRateDataAccess(db));
    }
}
