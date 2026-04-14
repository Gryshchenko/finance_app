import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import AccountServiceBuilder from 'services/account/AccountServiceBuilder';
import BalanceServiceBuilder from 'services/balance/BalanceServiceBuilder';
import { StatsOrchestratorServiceBuilder } from 'services/StatsOrchestrator/StatsOrchestratorServiceBuilder';
import TransactionDataAccess from 'services/transaction/TransactionDataAccess';
import TransactionService from 'services/transaction/TransactionService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class TransactionServiceBuilder {
    public static build(db?: IDatabaseConnection): TransactionService {
        const databaseConnection = db ?? DatabaseConnectionBuilder.build();
        return new TransactionService(
            new TransactionDataAccess(databaseConnection),
            AccountServiceBuilder.build(databaseConnection),
            BalanceServiceBuilder.build(databaseConnection),
            StatsOrchestratorServiceBuilder.build(databaseConnection),
            databaseConnection,
        );
    }
}
