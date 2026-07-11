import express from 'express';

import { CategoryController } from 'controllers/CategoryController';
import {
    categoryConvertValidationMessageToErrorCode,
    createCategoryValidationRules,
    deleteCategoryValidationRules,
    patchCategoryValidationRules,
} from 'src/utils/validation/categoryValidationRules';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { validateFromToDateQuery } from 'src/utils/validation/validateFromToDateQuery';
import { validatePathQueryProperty } from 'src/utils/validation/validatePathQueryProperty';
import { validateQuery } from 'src/utils/validation/validateQuery';

const categoryRouter = express.Router({ mergeParams: true });
const categoriesRouter = express.Router({ mergeParams: true });

categoryRouter.post(
    '/',
    validateQuery({}),
    sanitizeRequestBody(['currencyCode', 'categoryName', 'iconId', 'colorId', 'budget']),
    routesInputValidation(createCategoryValidationRules, categoryConvertValidationMessageToErrorCode),
    CategoryController.post,
);

categoriesRouter.get(
    '/stats',
    validateQuery({ from: 'date', to: 'date', period: 'string' }),
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
    sanitizeRequestBody(['keepData']),
    routesInputValidation(deleteCategoryValidationRules, categoryConvertValidationMessageToErrorCode),
    routesInputValidation([validatePathQueryProperty('categoryId')]),
    CategoryController.delete,
);

categoryRouter.patch(
    '/:categoryId',
    validateQuery({}),
    sanitizeRequestBody(['categoryName', 'status', 'iconId', 'colorId', 'budget', 'position']),
    routesInputValidation(patchCategoryValidationRules, categoryConvertValidationMessageToErrorCode),
    routesInputValidation([validatePathQueryProperty('categoryId')]),
    CategoryController.patch,
);

categoriesRouter.get('/', validateQuery({}), CategoryController.gets);

export { categoriesRouter, categoryRouter };
