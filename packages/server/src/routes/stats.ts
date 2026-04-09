import express from 'express';
import { validateQuery } from 'src/utils/validation/validateQuery';
// import { validateFromToDateQuery } from 'src/utils/validation/validateFromToDateQuery';
import { StatsController } from 'controllers/StatsController';
import { validateFromToDateQuery } from 'src/utils/validation/validateFromToDateQuery';

const statsRouter = express.Router({ mergeParams: true });

// statsRouter.get(
//     '/timeseries',
//     validateQuery({ from: 'date', to: 'date', period: 'string', cursor: 'number', limit: 'number' }),
//     validateFromToDateQuery({ from: 'date', to: 'date' }),
//     StatsController.timeseries,
// );

statsRouter.get(
    '/summary',
    validateQuery({ from: 'date', to: 'date', period: 'string' }),
    validateFromToDateQuery({ from: 'date', to: 'date' }),
    StatsController.summary,
);

export { statsRouter };
