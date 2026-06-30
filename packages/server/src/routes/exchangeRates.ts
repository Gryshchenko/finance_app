import express from 'express';
import { UserStatus } from 'tenpercent/shared';

import { ExchangeRateController } from 'controllers/ExchangeRateController';
import tokenVerify from 'middleware/tokenVerify';
import userStatusVerify from 'middleware/userStatusVerify';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { validateQuery } from 'src/utils/validation/validateQuery';

const exchangeRates = express.Router({ mergeParams: true });

exchangeRates.use(tokenVerify, userStatusVerify(UserStatus.ACTIVE));

exchangeRates.get(
    '/',
    validateQuery({ currency: 'string', targetCurrency: 'string', date: '?date' }),
    routesInputValidation([]),
    ExchangeRateController.get,
);

export default exchangeRates;
