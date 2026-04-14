import express from 'express';
import { UserStatus } from 'tenpercent/shared';

import { CurrencyController } from 'controllers/CurrencyController';
import tokenVerify from 'middleware/tokenVerify';
import userStatusVerify from 'middleware/userStatusVerify';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { validateQuery } from 'src/utils/validation/validateQuery';

const currencyRouter = express.Router({ mergeParams: true });

const currenciesRouter = express.Router({ mergeParams: true });

currencyRouter.use(tokenVerify, userStatusVerify(UserStatus.ACTIVE));

currenciesRouter.use(tokenVerify, userStatusVerify(UserStatus.ACTIVE));

currencyRouter.get('/', validateQuery({ currency: 'string' }), routesInputValidation([]), CurrencyController.get);

currenciesRouter.get('/', validateQuery({}), routesInputValidation([]), CurrencyController.gets);

export { currencyRouter, currenciesRouter };
