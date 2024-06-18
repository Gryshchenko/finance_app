import IncomeService from 'services/income/IncomeService';
import IncomeDataAccess from 'services/income/IncomeDataAccess';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class IncomeServiceBuilder {
    public static build() {
        return new IncomeService(new IncomeDataAccess(DatabaseConnectionBuilder.build()));
    }
}
