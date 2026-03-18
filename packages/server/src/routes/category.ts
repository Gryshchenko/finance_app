import { CategoryController } from 'controllers/CategoryController';
import express from 'express';
import { validateQuery } from 'src/utils/validation/validateQuery';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import {
    categoryConvertValidationMessageToErrorCode,
    createCategoryValidationRules,
    patchCategoryValidationRules,
} from 'src/utils/validation/categoryValidationRules';
import { validatePathQueryProperty } from 'src/utils/validation/validatePathQueryProperty';
import { validateFromToDateQuery } from 'src/utils/validation/validateFromToDateQuery';

const categoryRouter = express.Router({ mergeParams: true });
const categoriesRouter = express.Router({ mergeParams: true });

categoryRouter.post(
    '/',
    validateQuery({}),
    sanitizeRequestBody(['currencyId', 'categoryName', 'iconId']),
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
    routesInputValidation([validatePathQueryProperty('categoryId')]),
    CategoryController.delete,
);

categoryRouter.patch(
    '/:categoryId',
    validateQuery({}),
    sanitizeRequestBody(['categoryName', 'status', 'iconId']),
    routesInputValidation(patchCategoryValidationRules, categoryConvertValidationMessageToErrorCode),
    routesInputValidation([validatePathQueryProperty('categoryId')]),
    CategoryController.patch,
);

categoriesRouter.get('/', validateQuery({}), CategoryController.gets);

export { categoriesRouter, categoryRouter };
