import { createSignupValidationRules } from 'src/utils/validation/routesInputValidation';
import { body, CustomValidator } from 'express-validator';
import { ErrorCode } from 'types/ErrorCode';
import { ValidationError } from '../errors/ValidationError';
import { TransactionType } from 'types/TransactionType';
import Utils from '../Utils';

const atLeastOneFieldRequired: CustomValidator = (value, { req, path }) => {
    const { accountId, incomeId, categoryId, transactionTypeId } = req.body;

    const validationMap: Record<
        TransactionType,
        { expectFields: unknown[]; notExpectFields: unknown[]; errorCode: ErrorCode; message: string }
    > = {
        [TransactionType.Income]: {
            expectFields: [incomeId, accountId],
            notExpectFields: [categoryId],
            errorCode: ErrorCode.INCOME_ID_ERROR,
            message: 'accountId and incomeId are required; categoryId should not be present.',
        },
        [TransactionType.Expense]: {
            expectFields: [categoryId, accountId],
            notExpectFields: [incomeId],
            errorCode: ErrorCode.CATEGORY_ID_ERROR,
            message: 'accountId and categoryId are required; incomeId should not be present.',
        },
        [TransactionType.Transafer]: {
            expectFields: [accountId],
            notExpectFields: [incomeId, categoryId],
            errorCode: ErrorCode.ACCOUNT_ID_ERROR,
            message: 'accountId is required; incomeId and categoryId should not be present.',
        },
    };

    const validation = validationMap[transactionTypeId as TransactionType];

    if (!validation) {
        throw new ValidationError({
            message: `Invalid transaction type at '${path}'`,
            errorCode: ErrorCode.TRANSACTION_TYPE_ID_ERROR,
        });
    }

    const missingField = validation.expectFields.some(Utils.isNull);
    if (missingField) {
        throw new ValidationError({
            message: `Validation failed at '${path}': Missing required field '${missingField}'.`,
            errorCode: validation.errorCode,
        });
    }

    const forbiddenField = validation.notExpectFields.find(Utils.isNotNull);
    if (forbiddenField) {
        throw new ValidationError({
            message: `Validation failed at '${path}': Field '${forbiddenField}' should not be present.`,
            errorCode: ErrorCode.UNEXPECTED_PROPERTY,
        });
    }

    return true;
};

const createTransactionValidationRules = [
    body('transactionTypeId').custom(atLeastOneFieldRequired).bail(),
    ...createSignupValidationRules('currencyId', 'number', {}),
    ...createSignupValidationRules('transactionTypeId', 'number', {}),
    ...createSignupValidationRules('amount', 'number', {}),
    ...createSignupValidationRules('description', 'string', { max: 200 }),
    ...createSignupValidationRules('accountId', 'number', {
        optional: true,
    }),
    ...createSignupValidationRules('incomeId', 'number', {
        optional: true,
    }),
    ...createSignupValidationRules('categoryId', 'number', {
        optional: true,
    }),
];

export const transactionConvertValidationMessageToErrorCode = (path: string): ErrorCode => {
    console.log(path);
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
