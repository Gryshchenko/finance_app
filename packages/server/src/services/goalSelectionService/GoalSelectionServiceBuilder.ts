import GoalSelectionDataAccess from 'services/goalSelectionService/GoalSelectionDataAccess';
import GoalSelectionService from 'services/goalSelectionService/GoalSelectionService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class GoalSelectionServiceBuilder {
    public static build(db = DatabaseConnectionBuilder.build()): GoalSelectionService {
        return new GoalSelectionService(new GoalSelectionDataAccess(db));
    }
}
