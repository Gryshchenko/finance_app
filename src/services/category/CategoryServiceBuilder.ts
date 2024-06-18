import CategoryDataAccess from 'services/category/CategoryDataAccess';
import CategoryService from 'services/category/CategoryService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class CategoryServiceBuilder {
    public static build() {
        return new CategoryService(new CategoryDataAccess(DatabaseConnectionBuilder.build()));
    }
}
