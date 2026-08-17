import { AccountStatusType, StatsPeriod, StatsScope } from '@tenpercent/shared';
import express from 'express';

import { IncomeController } from 'controllers/IncomeController';
import {
    boolRule,
    colorRule,
    currencyCodeRule,
    dateRule,
    enumRule,
    iconRule,
    nameRule,
    numberRule,
    positionRule,
} from 'src/utils/validation/fieldRules';
import {
    incomeConvertValidationMessageToErrorCode,
    createIncomeValidationRules,
    deleteIncomeValidationRules,
    patchIncomeValidationRules,
} from 'src/utils/validation/incomeValidationRules';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { validateFromToDateQuery } from 'src/utils/validation/validateFromToDateQuery';
import { validatePathQueryProperty } from 'src/utils/validation/validatePathQueryProperty';
import { validateQuery } from 'src/utils/validation/validateQuery';

const incomeRouter = express.Router({ mergeParams: true });
const incomesRouter = express.Router({ mergeParams: true });

const statusRule = () => enumRule([AccountStatusType.Disable, AccountStatusType.Delete]);

incomeRouter.post(
    '/',
    validateQuery({}),
    sanitizeRequestBody(
        {
            incomeName: nameRule({ minLength: 3 }),
            currencyCode: currencyCodeRule(),
            amount: numberRule({ optional: true }),
            iconId: iconRule({ optional: false }),
            colorId: colorRule(),
        },
        incomeConvertValidationMessageToErrorCode,
    ),
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
    sanitizeRequestBody({ keepData: boolRule() }, incomeConvertValidationMessageToErrorCode),
    routesInputValidation(deleteIncomeValidationRules, incomeConvertValidationMessageToErrorCode),
    routesInputValidation([validatePathQueryProperty('incomeId')]),
    IncomeController.delete,
);

incomeRouter.patch(
    '/:incomeId',
    validateQuery({}),
    sanitizeRequestBody(
        {
            incomeName: nameRule({ optional: true, minLength: 3 }),
            status: statusRule(),
            iconId: iconRule(),
            colorId: colorRule(),
            position: positionRule(),
        },
        incomeConvertValidationMessageToErrorCode,
    ),
    routesInputValidation(patchIncomeValidationRules, incomeConvertValidationMessageToErrorCode),
    routesInputValidation([validatePathQueryProperty('incomeId')]),
    IncomeController.patch,
);

incomesRouter.get('/', validateQuery({}), IncomeController.gets);

incomesRouter.get(
    '/stats',
    validateQuery({
        from: dateRule(),
        to: dateRule(),
        period: enumRule(Object.values(StatsPeriod), { optional: false }),
        scope: enumRule(Object.values(StatsScope)),
    }),
    validateFromToDateQuery({ from: 'date', to: 'date' }),
    IncomeController.getStats,
);

export { incomesRouter, incomeRouter };
