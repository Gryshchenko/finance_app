import express from 'express';

import { BalanceController } from 'controllers/BalanceController';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { validateQuery } from 'src/utils/validation/validateQuery';

const balanceRouter = express.Router({ mergeParams: true });

balanceRouter.get('/', validateQuery({ scope: 'string?' }), routesInputValidation([]), BalanceController.get);

export default balanceRouter;
