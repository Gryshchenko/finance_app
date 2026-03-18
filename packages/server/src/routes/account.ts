import { AccountController } from 'controllers/AccountController';
import express from 'express';
import { validateQuery } from 'src/utils/validation/validateQuery';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import {
    accountConvertValidationMessageToErrorCode,
    createAccountValidationRules,
    patchAccountValidationRules,
} from 'src/utils/validation/accountValidationRules';
import { validatePathQueryProperty } from 'src/utils/validation/validatePathQueryProperty';

const accountRouter = express.Router({ mergeParams: true });
const accountsRouter = express.Router({ mergeParams: true });

accountRouter.post(
    '/',
    validateQuery({}),
    sanitizeRequestBody(['currencyId', 'accountName', 'amount', 'iconId']),
    routesInputValidation(createAccountValidationRules, accountConvertValidationMessageToErrorCode),
    AccountController.post,
);

accountRouter.get(
    '/:accountId',
    validateQuery({}),
    routesInputValidation([validatePathQueryProperty('accountId')]),
    AccountController.get,
);

accountRouter.delete(
    '/:accountId',
    validateQuery({}),
    routesInputValidation([validatePathQueryProperty('accountId')]),
    AccountController.delete,
);

accountRouter.patch(
    '/:accountId',
    validateQuery({}),
    sanitizeRequestBody(['accountName', 'amount', 'status', 'iconId']),
    routesInputValidation(patchAccountValidationRules, accountConvertValidationMessageToErrorCode),
    routesInputValidation([validatePathQueryProperty('accountId')]),
    AccountController.patch,
);

accountsRouter.get('/', validateQuery({}), AccountController.gets);

export { accountRouter, accountsRouter };
