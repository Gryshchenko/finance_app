import { UserStatus } from '@tenpercent/shared';
import express from 'express';

import { CurrencyController } from 'controllers/CurrencyController';
import { readLimiter } from 'middleware/limiters';
import { rateLimitMiddleware } from 'middleware/rateLimit';
import tokenVerify from 'middleware/tokenVerify';
import userStatusVerify from 'middleware/userStatusVerify';
import { currencyCodeRule } from 'src/utils/validation/fieldRules';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { validateQuery } from 'src/utils/validation/validateQuery';

const currencyRouter = express.Router({ mergeParams: true });

const currenciesRouter = express.Router({ mergeParams: true });

const perUserReadLimit = rateLimitMiddleware(readLimiter, (req) => String(req.user?.userId ?? req.ip ?? 'unknown'));

currencyRouter.use(tokenVerify, userStatusVerify(UserStatus.ACTIVE), perUserReadLimit);

currenciesRouter.use(tokenVerify, userStatusVerify(UserStatus.ACTIVE), perUserReadLimit);

currencyRouter.get('/', validateQuery({ currency: currencyCodeRule() }), routesInputValidation([]), CurrencyController.get);

currenciesRouter.get('/', validateQuery({}), routesInputValidation([]), CurrencyController.gets);

export { currencyRouter, currenciesRouter };
