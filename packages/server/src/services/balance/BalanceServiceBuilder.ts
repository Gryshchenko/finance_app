import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import BalanceDataAccess from 'services/balance/BalanceDataAccess';
import BalanceService from 'services/balance/BalanceService';
import CurrencyServiceBuilder from 'services/currency/CurrencyServiceBuilder';
import ExchangeRateServiceBuilder from 'services/exchangeRateService/ExchangeRateServiceBuilder';
import ProfileServiceBuilder from 'services/profile/ProfileServiceBuilder';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class BalanceServiceBuilder {
    public static build(db?: IDatabaseConnection): BalanceService {
        const databaseConnection = db ?? DatabaseConnectionBuilder.build();
        return new BalanceService(
            new BalanceDataAccess(databaseConnection),
            ProfileServiceBuilder.build(databaseConnection),
            ExchangeRateServiceBuilder.build(databaseConnection),
            CurrencyServiceBuilder.build(databaseConnection),
        );
    }
}
