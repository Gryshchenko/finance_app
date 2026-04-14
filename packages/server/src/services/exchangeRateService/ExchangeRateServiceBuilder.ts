import CurrencyServiceBuilder from 'services/currency/CurrencyServiceBuilder';
import ExchangeRateDataAccess from 'services/exchangeRateService/ExchangeRateDataAccess';
import ExchangeRateService from 'services/exchangeRateService/ExchangeRateService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class ExchangeRateServiceBuilder {
    public static build(db = DatabaseConnectionBuilder.build()) {
        return new ExchangeRateService(new ExchangeRateDataAccess(db), CurrencyServiceBuilder.build(db));
    }
}
