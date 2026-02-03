import { TransactionType } from 'tenpercent/shared';
import * as Yup from 'yup';

const translationsKeys = {
    valueRequired: 'validation:valueRequired',
    valueTooShort: 'validation:valueTooShort',
    valueTooLong: 'validation:valueTooLong',
    valueInvalidRange: 'validation:valueInvalidRange',
    codeInvalided: 'validation:codeInvalided',
};

const incomeCreate = {
    incomeName: Yup.string()
        .required(translationsKeys.valueRequired)
        .min(3, translationsKeys.valueTooShort)
        .max(50, translationsKeys.valueTooLong),
    currencyId: Yup.number()
        .min(Number.MIN_VALUE, translationsKeys.valueTooShort)
        .max(Number.MAX_VALUE, translationsKeys.valueTooLong),
};

const accountCreate = {
    amount: Yup.number()
        .min(Number.MIN_VALUE, translationsKeys.valueTooShort)
        .max(Number.MAX_VALUE, translationsKeys.valueTooLong),
    accountName: Yup.string()
        .required(translationsKeys.valueRequired)
        .min(3, translationsKeys.valueTooShort)
        .max(50, translationsKeys.valueTooLong),
    currencyId: Yup.number()
        .min(Number.MIN_VALUE, translationsKeys.valueTooShort)
        .max(Number.MAX_VALUE, translationsKeys.valueTooLong)
        .required(),
};
const categoryCreate = {
    categoryName: Yup.string()
        .required(translationsKeys.valueRequired)
        .min(3, translationsKeys.valueTooShort)
        .max(50, translationsKeys.valueTooLong),
    currencyId: Yup.number()
        .min(Number.MIN_VALUE, translationsKeys.valueTooShort)
        .max(Number.MAX_VALUE, translationsKeys.valueTooLong)
        .required(),
};
const incomeEdit = {
    incomeName: Yup.string().min(3, translationsKeys.valueTooShort).max(50, translationsKeys.valueTooLong).notRequired(),
    currencyId: Yup.number().notRequired(),
};

const accountEdit = {
    amount: Yup.number().min(0, translationsKeys.valueTooShort).notRequired(),
    accountName: Yup.string().min(3, translationsKeys.valueTooShort).max(50, translationsKeys.valueTooLong).notRequired(),
    currencyId: Yup.number().notRequired(),
};
const signUpConfirmation = {
    confirmationCode: Yup.string()
        .min(6, translationsKeys.valueTooShort)
        .max(8, translationsKeys.valueTooLong)
        .required(translationsKeys.codeInvalided),
};

const categoryEdit = {
    categoryName: Yup.string().min(3, translationsKeys.valueTooShort).max(50, translationsKeys.valueTooLong).notRequired(),
    currencyId: Yup.number().notRequired(),
};

const buildTransactionCreateSchema = () => {
    const now = new Date();
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
    const transactionsCreate = {
        transactionType: Yup.number()
            .min(Number.MIN_VALUE, translationsKeys.valueTooShort)
            .max(Number.MAX_VALUE, translationsKeys.valueTooLong)
            .required(),
        amount: Yup.number()
            .min(Number.MIN_VALUE, translationsKeys.valueTooShort)
            .max(Number.MAX_VALUE, translationsKeys.valueTooLong),
        description: Yup.string()
            .required(translationsKeys.valueRequired)
            .min(3, translationsKeys.valueTooShort)
            .max(150, translationsKeys.valueTooLong),
        currencyId: Yup.number()
            .min(Number.MIN_VALUE, translationsKeys.valueTooShort)
            .max(Number.MAX_VALUE, translationsKeys.valueTooLong),
        createdAt: Yup.date().min(twentyYearsAgo, translationsKeys.valueTooShort).max(now, translationsKeys.valueTooLong),
        accountId: Yup.string().when('transactionType', (transactionType, schema) => {
            if ((transactionType as unknown as TransactionType) === TransactionType.Transafer)
                return schema.required(translationsKeys.valueRequired);
            if ((transactionType as unknown as TransactionType) === TransactionType.Expense)
                return schema.required(translationsKeys.valueRequired);
            if ((transactionType as unknown as TransactionType) === TransactionType.Income)
                return schema.required(translationsKeys.valueRequired);
            return schema.notRequired();
        }),
        targetAccountId: Yup.string().when('transactionType', {
            is: TransactionType.Transafer,
            then: (schema) => schema.required(translationsKeys.valueRequired),
            otherwise: (schema) => schema.notRequired(),
        }),
        categoryId: Yup.string().when('transactionType', {
            is: TransactionType.Expense,
            then: (schema) => schema.required(translationsKeys.valueRequired),
            otherwise: (schema) => schema.notRequired(),
        }),
        incomeId: Yup.string().when('transactionType', {
            is: TransactionType.Income,
            then: (schema) => schema.required(translationsKeys.valueRequired),
            otherwise: (schema) => schema.notRequired(),
        }),
    };
    return Yup.object(transactionsCreate);
};
const buildTransactionEditSchema = () => {
    const now = new Date();
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);

    const transactionEdit = {
        transactionType: Yup.number().nullable(),
        amount: Yup.number()
            .min(0, translationsKeys.valueTooShort)
            .max(Number.MAX_VALUE, translationsKeys.valueTooLong)
            .notRequired(),

        description: Yup.string().min(3, translationsKeys.valueTooShort).max(150, translationsKeys.valueTooLong).notRequired(),

        currencyId: Yup.number()
            .min(0, translationsKeys.valueTooShort)
            .max(Number.MAX_VALUE, translationsKeys.valueTooLong)
            .notRequired(),

        createdAt: Yup.date()
            .min(twentyYearsAgo, translationsKeys.valueTooShort)
            .max(now, translationsKeys.valueTooLong)
            .notRequired(),

        accountId: Yup.string().when('transactionType', (transactionType, schema) => {
            if ((transactionType as unknown as TransactionType) === TransactionType.Transafer)
                return schema.required(translationsKeys.valueRequired);
            if ((transactionType as unknown as TransactionType) === TransactionType.Expense)
                return schema.required(translationsKeys.valueRequired);
            if ((transactionType as unknown as TransactionType) === TransactionType.Income)
                return schema.required(translationsKeys.valueRequired);
            return schema.notRequired();
        }),

        targetAccountId: Yup.string().when('transactionType', {
            is: TransactionType.Transafer,
            then: (schema) => schema.required(translationsKeys.valueRequired),
            otherwise: (schema) => schema.notRequired(),
        }),

        categoryId: Yup.string().when('transactionType', {
            is: TransactionType.Expense,
            then: (schema) => schema.required(translationsKeys.valueRequired),
            otherwise: (schema) => schema.notRequired(),
        }),

        incomeId: Yup.string().when('transactionType', {
            is: TransactionType.Income,
            then: (schema) => schema.required(translationsKeys.valueRequired),
            otherwise: (schema) => schema.notRequired(),
        }),
    };

    return Yup.object(transactionEdit);
};

const incomeCreateSchema = Yup.object(incomeCreate);
const incomeEditSchema = Yup.object(incomeEdit);

const accountCreateSchema = Yup.object(accountCreate);
const accountEditSchema = Yup.object(accountEdit);

const categoryCreateSchema = Yup.object(categoryCreate);
const categoryEditSchema = Yup.object(categoryEdit);

const signUpConfirmationShema = Yup.object(signUpConfirmation);

export {
    incomeEditSchema,
    incomeCreateSchema,
    accountEditSchema,
    accountCreateSchema,
    categoryEditSchema,
    categoryCreateSchema,
    buildTransactionCreateSchema,
    buildTransactionEditSchema,
    signUpConfirmationShema,
};
