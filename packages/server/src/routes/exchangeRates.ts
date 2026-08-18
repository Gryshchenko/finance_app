import { UserStatus } from '@tenpercent/shared';
import express from 'express';

import { ExchangeRateController } from 'controllers/ExchangeRateController';
import { readLimiter } from 'middleware/limiters';
import { rateLimitMiddleware } from 'middleware/rateLimit';
import tokenVerify from 'middleware/tokenVerify';
import userStatusVerify from 'middleware/userStatusVerify';
import { currencyCodeRule, dateRule } from 'src/utils/validation/fieldRules';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { validateQuery } from 'src/utils/validation/validateQuery';

const exchangeRates = express.Router({ mergeParams: true });

exchangeRates.use(
    tokenVerify,
    userStatusVerify(UserStatus.ACTIVE),
    rateLimitMiddleware(readLimiter, (req) => String(req.user?.userId ?? req.ip ?? 'unknown')),
);

exchangeRates.get(
    '/',
    validateQuery({
        currency: currencyCodeRule(),
        targetCurrency: currencyCodeRule(),
        date: dateRule({ optional: true }),
    }),
    routesInputValidation([]),
    ExchangeRateController.get,
);

export default exchangeRates;
