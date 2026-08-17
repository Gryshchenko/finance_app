import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { GroupOrchestrationServiceBuilder } from 'services/groupOrchestrator/GroupOrchestrationServiceBuilder';
import { IncomeOrchestrationService } from 'services/income/IncomeOrchestrationService';
import IncomeServiceBuilder from 'services/income/IncomeServiceBuilder';
import TransactionServiceBuilder from 'services/transaction/TransactionServiceBuilder';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export class IncomeOrchestrationServiceBuilder {
    public static build(db?: IDatabaseConnection): IncomeOrchestrationService {
        const databaseConnection = db ?? DatabaseConnectionBuilder.build();
        return new IncomeOrchestrationService({
            incomeService: IncomeServiceBuilder.build(databaseConnection),
            transactionService: TransactionServiceBuilder.build(databaseConnection),
            groupOrchestrationService: GroupOrchestrationServiceBuilder.build(databaseConnection),
        });
    }
}
