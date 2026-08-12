import express from 'express';

import { StatsController } from 'controllers/StatsController';
import { validateFromToDateQuery } from 'src/utils/validation/validateFromToDateQuery';
import { validateQuery } from 'src/utils/validation/validateQuery';

const statsRouter = express.Router({ mergeParams: true });

statsRouter.get(
    '/summary',
    validateQuery({ from: 'date', to: 'date', period: 'string', scope: 'string?' }),
    validateFromToDateQuery({ from: 'date', to: 'date' }),
    StatsController.summary,
);

statsRouter.get(
    '/entityStats/:entityId',
    validateQuery({ from: 'date', to: 'date', period: 'string', type: 'string' }),
    validateFromToDateQuery({ from: 'date', to: 'date' }),
    StatsController.entityStats,
);

export { statsRouter };
