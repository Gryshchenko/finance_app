import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import CategoryDataAccess from 'services/category/CategoryDataAccess';
import CategoryService from 'services/category/CategoryService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class CategoryServiceBuilder {
    public static build(db?: IDatabaseConnection) {
        return new CategoryService(new CategoryDataAccess(db ?? DatabaseConnectionBuilder.build()));
    }
}
