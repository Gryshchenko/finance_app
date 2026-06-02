import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import AccountServiceBuilder from 'services/account/AccountServiceBuilder';
import BalanceService from 'services/balance/BalanceService';
import CurrencyServiceBuilder from 'services/currency/CurrencyServiceBuilder';
import ExchangeRateServiceBuilder from 'services/exchangeRateService/ExchangeRateServiceBuilder';
import ProfileServiceBuilder from 'services/profile/ProfileServiceBuilder';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class BalanceServiceBuilder {
    public static build(db?: IDatabaseConnection): BalanceService {
        const databaseConnection = db ?? DatabaseConnectionBuilder.build();
        return new BalanceService(
            ProfileServiceBuilder.build(databaseConnection),
            ExchangeRateServiceBuilder.build(databaseConnection),
            CurrencyServiceBuilder.build(databaseConnection),
            AccountServiceBuilder.build(databaseConnection),
        );
    }
}
