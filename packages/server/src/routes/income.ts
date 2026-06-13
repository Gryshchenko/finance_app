import express from 'express';

import { IncomeController } from 'controllers/IncomeController';
import {
    incomeConvertValidationMessageToErrorCode,
    createIncomeValidationRules,
    patchIncomeValidationRules,
} from 'src/utils/validation/incomeValidationRules';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { validateFromToDateQuery } from 'src/utils/validation/validateFromToDateQuery';
import { validatePathQueryProperty } from 'src/utils/validation/validatePathQueryProperty';
import { validateQuery } from 'src/utils/validation/validateQuery';

const incomeRouter = express.Router({ mergeParams: true });
const incomesRouter = express.Router({ mergeParams: true });

incomeRouter.post(
    '/',
    validateQuery({}),
    sanitizeRequestBody(['currencyId', 'incomeName', 'amount', 'iconId', 'colorId']),
    routesInputValidation(createIncomeValidationRules, incomeConvertValidationMessageToErrorCode),
    IncomeController.post,
);

incomeRouter.get(
    '/:incomeId',
    validateQuery({}),
    routesInputValidation([validatePathQueryProperty('incomeId')]),
    IncomeController.get,
);

incomeRouter.delete(
    '/:incomeId',
    validateQuery({}),
    routesInputValidation([validatePathQueryProperty('incomeId')]),
    IncomeController.delete,
);

incomeRouter.patch(
    '/:incomeId',
    validateQuery({}),
    sanitizeRequestBody(['incomeName', 'status', 'iconId', 'colorId', 'position']),
    routesInputValidation(patchIncomeValidationRules, incomeConvertValidationMessageToErrorCode),
    routesInputValidation([validatePathQueryProperty('incomeId')]),
    IncomeController.patch,
);

incomesRouter.get('/', validateQuery({}), IncomeController.gets);

incomesRouter.get(
    '/stats',
    validateQuery({ from: 'date', to: 'date', period: 'string' }),
    validateFromToDateQuery({ from: 'date', to: 'date' }),
    IncomeController.getStats,
);

export { incomesRouter, incomeRouter };
