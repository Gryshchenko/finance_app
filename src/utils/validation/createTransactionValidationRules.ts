import { createSignupValidationRules } from 'src/utils/validation/routesInputValidation';
import { body, CustomValidator } from 'express-validator';
import { ErrorCode } from 'types/ErrorCode';
import { ValidationError } from '../errors/ValidationError';
import { TransactionType } from 'types/TransactionType';
import Utils from '../Utils';

const atLeastOneFieldRequired: CustomValidator = (value, { req }) => {
    const { accountId, incomeId, categoryId, transactionTypeId } = req.body;

    const validationMap: Record<TransactionType, { fields: unknown[]; errorCode: ErrorCode }> = {
        [TransactionType.Income]: {
            fields: [incomeId, accountId],
            errorCode: ErrorCode.INCOME_ID_ERROR,
        },
        [TransactionType.Expense]: {
            fields: [categoryId, accountId],
            errorCode: ErrorCode.CATEGORY_ID_ERROR,
        },
        [TransactionType.Transafer]: {
            fields: [accountId],
            errorCode: ErrorCode.ACCOUNT_ID_ERROR,
        },
    };

    const validation = validationMap[transactionTypeId as TransactionType];

    if (validation && validation.fields.every(Utils.isNull)) {
        throw new ValidationError({
            message: 'At least one of accountId, incomeId, or categoryId is required.',
            errorCode: validation.errorCode,
        });
    }

    return true;
};

const createTransactionValidationRules = [
    ...createSignupValidationRules('accountId', 'number', {
        optional: true,
    }),
    ...createSignupValidationRules('incomeId', 'number', {
        optional: true,
    }),
    ...createSignupValidationRules('categoryId', 'number', {
        optional: true,
    }),
    body().custom(atLeastOneFieldRequired),
    ...createSignupValidationRules('currencyId', 'number', {}),
    ...createSignupValidationRules('y', 'number', {}),
    ...createSignupValidationRules('amount', 'number', {}),
    ...createSignupValidationRules('description', 'string', { max: 200 }),
];

export const transactionConvertValidationMessageToErrorCode = (path: string): ErrorCode => {
    switch (path) {
        case 'accountId': {
            return ErrorCode.ACCOUNT_ID_ERROR;
        }
        case 'incomeId': {
            return ErrorCode.INCOME_ID_ERROR;
        }
        case 'categoryId': {
            return ErrorCode.CATEGORY_ID_ERROR;
        }
        case 'currencyId': {
            return ErrorCode.CURRENCY_ID_ERROR;
        }
        case 'transactionTypeId': {
            return ErrorCode.TRANSACTION_TYPE_ID_ERROR;
        }
        case 'amount': {
            return ErrorCode.AMOUNT_ERROR;
        }
        case 'description': {
            return ErrorCode.DESCRIPTION_ERROR;
        }
        default: {
            return ErrorCode.TRANSACTION_ERROR;
        }
    }
};

export default createTransactionValidationRules;
