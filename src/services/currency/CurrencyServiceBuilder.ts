import CurrencyDataAccess from 'services/currency/CurrencyDataAccess';
import CurrencyService from 'services/currency/CurrencyService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class CurrencyServiceBuilder {
    public static build() {
        return new CurrencyService(new CurrencyDataAccess(DatabaseConnectionBuilder.build()));
    }
}
