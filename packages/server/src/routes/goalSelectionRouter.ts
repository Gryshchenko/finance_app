import express from 'express';

import { GoalSelectionController } from 'controllers/GoalSelectionController';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { validateQuery } from 'src/utils/validation/validateQuery';

const goalSelectionRouter = express.Router({ mergeParams: true });

goalSelectionRouter.get('/', validateQuery({}), GoalSelectionController.get);

goalSelectionRouter.post('/', validateQuery({}), sanitizeRequestBody(['selectedGoals']), GoalSelectionController.post);

export default goalSelectionRouter;
