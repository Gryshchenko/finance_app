import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import IncomeDataAccess from 'services/income/IncomeDataAccess';
import IncomeService from 'services/income/IncomeService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class IncomeServiceBuilder {
    public static build(db?: IDatabaseConnection) {
        return new IncomeService(new IncomeDataAccess(db ?? DatabaseConnectionBuilder.build()));
    }
}
