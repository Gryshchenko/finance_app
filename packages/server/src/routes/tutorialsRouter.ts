import express from 'express';

import { TutorialController } from 'controllers/TutorialController';
import { boolRule, intRule } from 'src/utils/validation/fieldRules';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { patchTutorialValidationRules } from 'src/utils/validation/tutorialValidationRules';
import { validateQuery } from 'src/utils/validation/validateQuery';

const tutorialsRouter = express.Router({ mergeParams: true });

tutorialsRouter.get('/', validateQuery({}), TutorialController.get);

tutorialsRouter.patch(
    '/',
    validateQuery({}),
    // This route had no body whitelist at all, so any field could be posted; the flags
    // themselves were declared `'boolean'`, which the express-validator helper ignored.
    sanitizeRequestBody({
        isOnBoardingTutorialView: boolRule(),
        isAccountTutorialView: boolRule(),
        isDashboardTutorialView: boolRule(),
        isBalanceInsightsTutorialView: boolRule(),
        isIncomeTutorialView: boolRule(),
        isSharingTutorialView: boolRule(),
        isCategoryTutorialView: boolRule(),
        onBoardingViewedSlidesCount: intRule({ optional: true, min: 0, max: 100 }),
    }),
    routesInputValidation(patchTutorialValidationRules),
    TutorialController.patch,
);

export default tutorialsRouter;
