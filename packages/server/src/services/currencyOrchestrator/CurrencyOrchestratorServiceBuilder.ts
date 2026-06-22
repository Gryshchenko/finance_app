import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import CurrencyServiceBuilder from 'services/currency/CurrencyServiceBuilder';
import CurrencyOrchestratorService, {
    ICurrencyOrchestratorService,
} from 'services/currencyOrchestrator/CurrencyOrchestratorService';
import ExchangeRateServiceBuilder from 'services/exchangeRateService/ExchangeRateServiceBuilder';
import HistoricalRateServiceBuilder from 'services/historicalRateService/HistoricalRateServiceBuilder';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export class CurrencyOrchestratorServiceBuilder {
    static build(db?: IDatabaseConnection): ICurrencyOrchestratorService {
        const database = db ?? DatabaseConnectionBuilder.build();
        return new CurrencyOrchestratorService({
            exchangeRateService: ExchangeRateServiceBuilder.build(database),
            currencyService: CurrencyServiceBuilder.build(database),
            historicalRateService: HistoricalRateServiceBuilder.build(database),
        });
    }
}
