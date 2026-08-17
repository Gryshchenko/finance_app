import { StatsScope, TransactionType } from '@tenpercent/shared';
import express from 'express';

import { TransactionController } from 'controllers/TransactionController';
import {
    cursorRule,
    currencyCodeRule,
    dateRule,
    enumRule,
    idRule,
    limitRule,
    numberRule,
    stringRule,
} from 'src/utils/validation/fieldRules';
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

/**
 * Which of `incomeId` / `categoryId` / `targetAccountId` is required for a given
 * `transactionTypeId` is a cross-field rule and stays in `createTransactionValidationRules`;
 * here each one is only typed and bounded.
 */
const descriptionRule = (optional = true) => stringRule({ optional, minLength: 3, maxLength: 200 });

transactionRouter.post(
    '/',
    validateQuery({}),
    sanitizeRequestBody(
        {
            transactionTypeId: enumRule([TransactionType.Income, TransactionType.Expense, TransactionType.Transafer], {
                optional: false,
            }),
            accountId: idRule(),
            incomeId: idRule(),
            categoryId: idRule(),
            targetAccountId: idRule(),
            currencyCode: currencyCodeRule(),
            targetCurrencyCode: currencyCodeRule(),
            amount: numberRule({ gt: 0 }),
            targetAmount: numberRule({ gt: 0 }),
            description: descriptionRule(),
            createdAt: dateRule({ optional: true }),
        },
        transactionConvertValidationMessageToErrorCode,
    ),
    routesInputValidation(createTransactionValidationRules, transactionConvertValidationMessageToErrorCode),
    TransactionController.create,
);

transactionsRouter.get(
    '/',
    validateQuery({
        cursor: cursorRule(),
        limit: limitRule(),
        accountId: idRule(),
        categoryId: idRule(),
        incomeId: idRule(),
        scope: enumRule(Object.values(StatsScope)),
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
    sanitizeRequestBody({}),
    routesInputValidation([validatePathQueryProperty('transactionId')]),
    TransactionController.delete,
);

transactionRouter.patch(
    '/:transactionId',
    validateQuery({}),
    routesInputValidation([validatePathQueryProperty('transactionId')]),
    sanitizeRequestBody(
        {
            accountId: idRule(),
            incomeId: idRule(),
            categoryId: idRule(),
            targetAccountId: idRule(),
            currencyCode: currencyCodeRule({ optional: true }),
            targetCurrencyCode: currencyCodeRule({ optional: true }),
            amount: numberRule({ optional: true, gt: 0 }),
            targetAmount: numberRule({ optional: true, gt: 0 }),
            description: descriptionRule(),
            createdAt: dateRule({ optional: true }),
        },
        transactionConvertValidationMessageToErrorCode,
    ),
    routesInputValidation(patchTransactionValidationRules, transactionConvertValidationMessageToErrorCode),
    TransactionController.patch,
);

export { transactionRouter, transactionsRouter };
