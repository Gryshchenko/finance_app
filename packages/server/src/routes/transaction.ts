import express from 'express';

import { TransactionController } from 'controllers/TransactionController';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import {
    transactionConvertValidationMessageToErrorCode,
    createTransactionValidationRules,
    patchTransactionValidationRules,
} from 'src/utils/validation/transactionValidationRules';
import { validatePathQueryProperty } from 'src/utils/validation/validatePathQueryProperty';
import { validateQuery } from 'src/utils/validation/validateQuery';

const transactionRouter = express.Router({ mergeParams: true });
const transactionsRouter = express.Router({ mergeParams: true });

transactionRouter.post(
    '/',
    validateQuery({}),
    sanitizeRequestBody([
        'accountId',
        'incomeId',
        'categoryId',
        'currencyId',
        'transactionTypeId',
        'amount',
        'createdAt',
        'targetAccountId',
        'description',
    ]),
    routesInputValidation(createTransactionValidationRules, transactionConvertValidationMessageToErrorCode),
    TransactionController.create,
);

transactionsRouter.get(
    '/',
    validateQuery({
        cursor: 'number',
        limit: 'number',
        accountId: 'number?',
        categoryId: 'number?',
        incomeId: 'number?',
        orderBy: 'string?',
    }),
    TransactionController.getAll,
);

transactionRouter.get(
    '/:transactionId',
    validateQuery({}),
    routesInputValidation([validatePathQueryProperty('transactionId')]),
    TransactionController.get,
);

transactionRouter.delete(
    '/:transactionId',
    validateQuery({}),
    routesInputValidation([validatePathQueryProperty('transactionId')]),
    TransactionController.delete,
);

transactionRouter.patch(
    '/:transactionId',
    validateQuery({}),
    routesInputValidation([validatePathQueryProperty('transactionId')]),
    sanitizeRequestBody([
        'accountId',
        'incomeId',
        'categoryId',
        'currencyId',
        'amount',
        'description',
        'createdAt',
        'targetAccountId',
    ]),
    routesInputValidation(patchTransactionValidationRules, transactionConvertValidationMessageToErrorCode),
    TransactionController.patch,
);

export { transactionRouter, transactionsRouter };
