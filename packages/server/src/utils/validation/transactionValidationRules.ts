import { ErrorCode, Utils, Time } from '@tenpercent/shared';
import { body } from 'express-validator';

import { createSignupValidationRules } from 'src/utils/validation/routesInputValidation';
import { TransactionType } from 'types/TransactionType';

import { ValidationError } from '../errors/ValidationError';

const baseAtLeastOneFieldRequired = ({
    accountId,
    incomeId,
    categoryId,
    transactionTypeId,
    targetAccountId,
    path,
}: {
    accountId: number;
    incomeId: number;
    categoryId: number;
    transactionTypeId: number;
    targetAccountId: number;
    path: string;
}) => {
    const validationMap: Record<
        TransactionType,
        { expectFields: Map<string, unknown>; notExpectFields: Map<string, unknown>; errorCode: ErrorCode; message: string }
    > = {
        [TransactionType.Income]: {
            expectFields: new Map().set('incomeId', incomeId).set('accountId', accountId),
            notExpectFields: new Map().set('categoryId', categoryId),
            errorCode: ErrorCode.INCOME_ERROR,
            message: 'accountId and incomeId are required; categoryId should not be present.',
        },
        [TransactionType.Expense]: {
            expectFields: new Map().set('categoryId', categoryId).set('accountId', accountId),
            notExpectFields: new Map().set('incomeId', incomeId),
            errorCode: ErrorCode.CATEGORY_ERROR,
            message: 'accountId and categoryId are required; incomeId should not be present.',
        },
        [TransactionType.Transafer]: {
            expectFields: new Map().set('accountId', accountId).set('targetAccountId', targetAccountId),
            notExpectFields: new Map().set('incomeId', incomeId).set('categoryId', categoryId),
            errorCode: ErrorCode.ACCOUNT_ERROR,
            message: 'accountId is required; incomeId and categoryId should not be present.',
        },
    };

    const validation = validationMap[transactionTypeId as TransactionType];

    if (!validation) {
        throw new ValidationError({
            message: `Invalid transaction type at '${path}'`,
            errorCode: ErrorCode.TRANSACTION_ERROR,
        });
    }

    for (const field of validation.expectFields.keys()) {
        if (Utils.isNull(validation.expectFields.get(field as string))) {
            throw new ValidationError({
                message: `Validation failed at '${path}': Missing required field '${field}'.`,
                errorCode: validation.errorCode,
            });
        }
    }

    for (const field of validation.notExpectFields.keys()) {
        if (Utils.isNotNull(validation.notExpectFields.get(field as string))) {
            throw new ValidationError({
                message: `Validation failed at '${path}': Field '${field}' should not be present.`,
                errorCode: ErrorCode.UNEXPECTED_PROPERTY,
            });
        }
    }

    if (transactionTypeId === TransactionType.Transafer && accountId === targetAccountId) {
        throw new ValidationError({
            message: `Validation failed at '${path}': Source and target accounts must differ for transfer.`,
            errorCode: ErrorCode.ACCOUNT_ERROR,
            payload: { field: 'targetAccountId', reason: 'validation:targetAccountSameAsSource' },
        });
    }

    return true;
};

const createTransactionValidationRules = [
    body('transaction')
        .custom((_, { req }) => {
            const { accountId, incomeId, categoryId, transactionTypeId, targetAccountId } = req.body;
            return baseAtLeastOneFieldRequired({
                accountId,
                incomeId,
                categoryId,
                transactionTypeId,
                targetAccountId,
                path: 'transaction',
            });
        })
        .bail(),
    ...createSignupValidationRules('targetAmount', 'number', { gt: 0 }),
    ...createSignupValidationRules('targetCurrencyCode', 'string', { min: 1, max: 10 }),
    ...createSignupValidationRules('currencyCode', 'string', { min: 1, max: 10 }),
    ...createSignupValidationRules('transactionTypeId', 'number', {}),
    ...createSignupValidationRules('amount', 'number', { gt: 0 }),
    ...createSignupValidationRules('description', 'string', { max: 200, min: 3, optional: true }),
    ...createSignupValidationRules('accountId', 'number', {
        optional: true,
    }),
    ...createSignupValidationRules('incomeId', 'number', {
        optional: true,
    }),
    ...createSignupValidationRules('targetAccountId', 'number', {
        optional: true,
    }),
    ...createSignupValidationRules('categoryId', 'number', {
        optional: true,
    }),
    ...createSignupValidationRules('createdAt', 'date', {
        optional: true,
    }),
    body('createdAt')
        .custom((_, { req }) => {
            const { createdAt } = req.body;
            if (createdAt === undefined) return true;
            try {
                Time.parseUTC(createdAt);
            } catch (e) {
                throw new ValidationError({
                    message: `Validation failed at createdAt': ${(e as { message: string }).message}`,
                    errorCode: ErrorCode.UNEXPECTED_PROPERTY,
                });
            }
            return true;
        })
        .bail(),
];

const patchTransactionValidationRules = [
    body('transaction')
        .custom((_, { req }) => {
            const { accountId, targetAccountId } = req.body;
            if (Utils.isNotNull(accountId) && Utils.isNotNull(targetAccountId) && accountId === targetAccountId) {
                throw new ValidationError({
                    message: 'Source and target accounts must differ for transfer.',
                    errorCode: ErrorCode.ACCOUNT_ERROR,
                    payload: { field: 'targetAccountId', reason: 'validation:targetAccountSameAsSource' },
                });
            }
            return true;
        })
        .bail(),
    ...createSignupValidationRules('amount', 'number', {
        optional: true,
        gt: 0,
    }),
    ...createSignupValidationRules('description', 'string', {
        optional: true,
        max: 200,
        min: 3,
    }),
    ...createSignupValidationRules('accountId', 'number', {
        optional: true,
    }),
    ...createSignupValidationRules('incomeId', 'number', {
        optional: true,
    }),
    ...createSignupValidationRules('targetAccountId', 'number', {
        optional: true,
    }),
    ...createSignupValidationRules('categoryId', 'number', {
        optional: true,
    }),
    ...createSignupValidationRules('createdAt', 'date', {
        optional: true,
    }),

    ...createSignupValidationRules('targetAmount', 'number', { optional: true, gt: 0 }),
    ...createSignupValidationRules('targetCurrencyCode', 'string', { min: 1, max: 10, optional: true }),
    body('createdAt')
        .custom((_, { req }) => {
            const { createdAt } = req.body;
            if (createdAt === undefined) return true;
            try {
                Time.parseUTC(createdAt);
            } catch (e) {
                throw new ValidationError({
                    message: `Validation failed at createdAt': ${(e as { message: string }).message}`,
                    errorCode: ErrorCode.UNEXPECTED_PROPERTY,
                });
            }
            return true;
        })
        .bail(),
];

export const transactionConvertValidationMessageToErrorCode = (path: string): ErrorCode => {
    switch (path) {
        case 'targetCurrencyCode': {
            return ErrorCode.TRANSACTION_ERROR;
        }
        case 'targetAmount': {
            return ErrorCode.TRANSACTION_ERROR;
        }
        case 'targetAccountId': {
            return ErrorCode.ACCOUNT_ERROR;
        }
        case 'accountId': {
            return ErrorCode.ACCOUNT_ERROR;
        }
        case 'incomeId': {
            return ErrorCode.INCOME_ERROR;
        }
        case 'categoryId': {
            return ErrorCode.CATEGORY_ERROR;
        }
        case 'currencyCode': {
            return ErrorCode.CURRENCY_ERROR;
        }
        case 'transactionTypeId': {
            return ErrorCode.TRANSACTION_ERROR;
        }
        case 'amount': {
            return ErrorCode.TRANSACTION_ERROR;
        }
        case 'description': {
            return ErrorCode.TRANSACTION_ERROR;
        }
        case 'createdAt': {
            return ErrorCode.TRANSACTION_ERROR;
        }
        default: {
            return ErrorCode.TRANSACTION_ERROR;
        }
    }
};

export { createTransactionValidationRules, patchTransactionValidationRules };
