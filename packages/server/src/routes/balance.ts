import { StatsScope } from '@tenpercent/shared';
import express from 'express';

import { BalanceController } from 'controllers/BalanceController';
import { enumRule } from 'src/utils/validation/fieldRules';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { validateQuery } from 'src/utils/validation/validateQuery';

const balanceRouter = express.Router({ mergeParams: true });

balanceRouter.get(
    '/',
    validateQuery({ scope: enumRule(Object.values(StatsScope)) }),
    routesInputValidation([]),
    BalanceController.get,
);

export default balanceRouter;
