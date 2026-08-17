import express from 'express';

import { OverviewController } from 'src/controllers/OverviewController';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { validateQuery } from 'src/utils/validation/validateQuery';

const router = express.Router({ mergeParams: true });

router.get('/', validateQuery({}), sanitizeRequestBody({}), OverviewController.overview);

export default router;
