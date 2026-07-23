import express from 'express';

import { TutorialController } from 'controllers/TutorialController';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { patchTutorialValidationRules } from 'src/utils/validation/tutorialValidationRules';
import { validateQuery } from 'src/utils/validation/validateQuery';

const tutorialsRouter = express.Router({ mergeParams: true });

tutorialsRouter.get('/', validateQuery({}), TutorialController.get);

tutorialsRouter.patch('/', validateQuery({}), routesInputValidation(patchTutorialValidationRules), TutorialController.patch);

export default tutorialsRouter;
