import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { CategoryOrchestrationService } from 'services/category/CategoryOrchestrationService';
import CategoryServiceBuilder from 'services/category/CategoryServiceBuilder';
import { GroupOrchestrationServiceBuilder } from 'services/groupOrchestrator/GroupOrchestrationServiceBuilder';
import TransactionServiceBuilder from 'services/transaction/TransactionServiceBuilder';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export class CategoryOrchestrationServiceBuilder {
    public static build(db?: IDatabaseConnection): CategoryOrchestrationService {
        const databaseConnection = db ?? DatabaseConnectionBuilder.build();
        return new CategoryOrchestrationService({
            categoryService: CategoryServiceBuilder.build(databaseConnection),
            transactionService: TransactionServiceBuilder.build(databaseConnection),
            groupOrchestrationService: GroupOrchestrationServiceBuilder.build(databaseConnection),
        });
    }
}
