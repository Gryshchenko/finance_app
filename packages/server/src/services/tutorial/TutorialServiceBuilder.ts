import TutorialDataAccess from 'services/tutorial/TutorialDataAccess';
import TutorialService from 'services/tutorial/TutorialService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class TutorialServiceBuilder {
    public static build(db = DatabaseConnectionBuilder.build()): TutorialService {
        return new TutorialService(new TutorialDataAccess(db));
    }
}
