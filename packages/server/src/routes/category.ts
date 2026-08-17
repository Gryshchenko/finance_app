import { AccountStatusType, StatsPeriod, StatsScope } from '@tenpercent/shared';
import express from 'express';

import { CategoryController } from 'controllers/CategoryController';
import {
    categoryConvertValidationMessageToErrorCode,
    createCategoryValidationRules,
    deleteCategoryValidationRules,
    patchCategoryValidationRules,
} from 'src/utils/validation/categoryValidationRules';
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
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { validateFromToDateQuery } from 'src/utils/validation/validateFromToDateQuery';
import { validatePathQueryProperty } from 'src/utils/validation/validatePathQueryProperty';
import { validateQuery } from 'src/utils/validation/validateQuery';

const categoryRouter = express.Router({ mergeParams: true });
const categoriesRouter = express.Router({ mergeParams: true });

const statusRule = () => enumRule([AccountStatusType.Disable, AccountStatusType.Delete]);

categoryRouter.post(
    '/',
    validateQuery({}),
    sanitizeRequestBody(
        {
            categoryName: nameRule({ minLength: 3 }),
            currencyCode: currencyCodeRule(),
            iconId: iconRule({ optional: false }),
            colorId: colorRule(),
            budget: numberRule({ optional: true, min: 0 }),
        },
        categoryConvertValidationMessageToErrorCode,
    ),
    routesInputValidation(createCategoryValidationRules, categoryConvertValidationMessageToErrorCode),
    CategoryController.post,
);

categoriesRouter.get(
    '/stats',
    validateQuery({
        from: dateRule(),
        to: dateRule(),
        period: enumRule(Object.values(StatsPeriod), { optional: false }),
        scope: enumRule(Object.values(StatsScope)),
    }),
    validateFromToDateQuery({ from: 'date', to: 'date' }),
    CategoryController.getStats,
);

categoryRouter.get(
    '/:categoryId',
    validateQuery({}),
    routesInputValidation([validatePathQueryProperty('categoryId')]),
    CategoryController.get,
);

categoryRouter.delete(
    '/:categoryId',
    validateQuery({}),
    sanitizeRequestBody({ keepData: boolRule() }, categoryConvertValidationMessageToErrorCode),
    routesInputValidation(deleteCategoryValidationRules, categoryConvertValidationMessageToErrorCode),
    routesInputValidation([validatePathQueryProperty('categoryId')]),
    CategoryController.delete,
);

categoryRouter.patch(
    '/:categoryId',
    validateQuery({}),
    sanitizeRequestBody(
        {
            categoryName: nameRule({ optional: true, minLength: 3 }),
            status: statusRule(),
            iconId: iconRule(),
            colorId: colorRule(),
            budget: numberRule({ optional: true, min: 0 }),
            position: positionRule(),
        },
        categoryConvertValidationMessageToErrorCode,
    ),
    routesInputValidation(patchCategoryValidationRules, categoryConvertValidationMessageToErrorCode),
    routesInputValidation([validatePathQueryProperty('categoryId')]),
    CategoryController.patch,
);

categoriesRouter.get('/', validateQuery({}), CategoryController.gets);

export { categoriesRouter, categoryRouter };
