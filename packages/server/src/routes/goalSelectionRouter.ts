import { VALID_GOAL_IDS } from '@tenpercent/shared';
import express from 'express';

import { GoalSelectionController } from 'controllers/GoalSelectionController';
import { arrayRule, enumRule } from 'src/utils/validation/fieldRules';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { validateQuery } from 'src/utils/validation/validateQuery';

const goalSelectionRouter = express.Router({ mergeParams: true });

goalSelectionRouter.get('/', validateQuery({}), GoalSelectionController.get);

goalSelectionRouter.post(
    '/',
    validateQuery({}),
    // `selectedGoals` was whitelisted but never validated: any array of any strings was
    // stored, truncated to 100 characters each by the controller. The goals are a closed
    // set, so the schema is the set.
    sanitizeRequestBody({
        selectedGoals: arrayRule(enumRule(VALID_GOAL_IDS, { optional: false }), {
            optional: false,
            maxLength: VALID_GOAL_IDS.length,
        }),
    }),
    GoalSelectionController.post,
);

export default goalSelectionRouter;
