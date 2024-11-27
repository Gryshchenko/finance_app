import TransactionDataAccess from 'services/transaction/TransactionDataAccess';
import TransactionService from 'services/transaction/TransactionService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class TransactionServiceBuilder {
    public static build() {
        return new TransactionService(new TransactionDataAccess(DatabaseConnectionBuilder.build()));
    }
}
