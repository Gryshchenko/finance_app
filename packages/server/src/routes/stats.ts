import { StatsPeriod, StatsScope, StatsType } from '@tenpercent/shared';
import express from 'express';

import { StatsController } from 'controllers/StatsController';
import { dateRule, enumRule } from 'src/utils/validation/fieldRules';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { validateFromToDateQuery } from 'src/utils/validation/validateFromToDateQuery';
import { validatePathQueryProperty } from 'src/utils/validation/validatePathQueryProperty';
import { validateQuery } from 'src/utils/validation/validateQuery';

const statsRouter = express.Router({ mergeParams: true });

statsRouter.get(
    '/summary',
    validateQuery({
        from: dateRule(),
        to: dateRule(),
        period: enumRule(Object.values(StatsPeriod), { optional: false }),
        scope: enumRule(Object.values(StatsScope)),
    }),
    validateFromToDateQuery({ from: 'date', to: 'date' }),
    StatsController.summary,
);

statsRouter.get(
    '/entityStats/:entityId',
    validateQuery({
        from: dateRule(),
        to: dateRule(),
        period: enumRule(Object.values(StatsPeriod), { optional: false }),
        type: enumRule(Object.values(StatsType), { optional: false }),
    }),
    routesInputValidation([validatePathQueryProperty('entityId')]),
    validateFromToDateQuery({ from: 'date', to: 'date' }),
    StatsController.entityStats,
);

export { statsRouter };
