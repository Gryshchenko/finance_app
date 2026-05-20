import { TransactionType } from 'tenpercent/shared';
import * as Yup from 'yup';

const translationsKeys = {
    // Generic fallbacks
    valueRequired: 'validation:valueRequired',

    // Names
    nameRequired: 'validation:nameRequired',
    nameTooShort: 'validation:nameTooShort',
    nameTooLong: 'validation:nameTooLong',
    publicNameTooLong: 'validation:publicNameTooLong',

    // Amount
    amountTooSmall: 'validation:amountTooSmall',
    amountTooLarge: 'validation:amountTooLarge',

    // Description
    descriptionTooShort: 'validation:descriptionTooShort',
    descriptionTooLong: 'validation:descriptionTooLong',

    // Date
    dateTooOld: 'validation:dateTooOld',
    dateInFuture: 'validation:dateInFuture',

    // Currency / Locale
    currencyRequired: 'validation:currencyRequired',
    currencyInvalid: 'validation:currencyInvalid',
    unsupportedCurrency: 'validation:unsupportedCurrency',
    localeRequired: 'validation:localeRequired',
    unsupportedLanguage: 'validation:unsupportedLanguage',

    // Icon
    iconRequired: 'validation:iconRequired',

    // Transaction selectors
    transactionTypeRequired: 'validation:transactionTypeRequired',
    accountRequired: 'validation:accountRequired',
    targetAccountRequired: 'validation:targetAccountRequired',
    categoryRequired: 'validation:categoryRequired',
    incomeRequired: 'validation:incomeRequired',

    // Confirmation code
    codeRequired: 'validation:codeRequired',
    codeTooShort: 'validation:codeTooShort',
    codeTooLong: 'validation:codeTooLong',

    // Email
    emailRequired: 'validation:emailRequired',
    emailTooLong: 'validation:emailTooLong',
    emailInvalid: 'validation:email',

    // Password
    passwordRequired: 'validation:passwordRequired',
    passwordTooLong: 'validation:passwordTooLong',
    passwordMinLength: 'validation:passwordMinLength',
    passwordUppercase: 'validation:passwordUppercase',
    passwordLowercase: 'validation:passwordLowercase',
    passwordNumber: 'validation:passwordNumber',
    passwordSpecial: 'validation:passwordSpecial',
    newPasswordRequired: 'validation:newPasswordRequired',
    currentPasswordRequired: 'validation:currentPasswordRequired',
    repeatPasswordRequired: 'validation:repeatPasswordRequired',
    passwordsDoNotMatch: 'validation:passwordsDoNotMatch',
};

const incomeCreate = {
    incomeName: Yup.string()
        .required(translationsKeys.nameRequired)
        .min(3, translationsKeys.nameTooShort)
        .max(50, translationsKeys.nameTooLong),
    currencyId: Yup.number()
        .min(Number.MIN_SAFE_INTEGER, translationsKeys.currencyInvalid)
        .max(Number.MAX_SAFE_INTEGER, translationsKeys.currencyInvalid)
        .required(translationsKeys.currencyRequired),
    iconId: Yup.string().required(translationsKeys.iconRequired),
};

const accountCreate = {
    amount: Yup.number()
        .min(Number.MIN_SAFE_INTEGER, translationsKeys.amountTooSmall)
        .max(Number.MAX_SAFE_INTEGER, translationsKeys.amountTooLarge),
    accountName: Yup.string()
        .required(translationsKeys.nameRequired)
        .min(3, translationsKeys.nameTooShort)
        .max(50, translationsKeys.nameTooLong),
    currencyId: Yup.number()
        .min(Number.MIN_SAFE_INTEGER, translationsKeys.currencyInvalid)
        .max(Number.MAX_SAFE_INTEGER, translationsKeys.currencyInvalid)
        .required(translationsKeys.currencyRequired),
};
const categoryCreate = {
    categoryName: Yup.string()
        .required(translationsKeys.nameRequired)
        .min(3, translationsKeys.nameTooShort)
        .max(50, translationsKeys.nameTooLong),
    currencyId: Yup.number()
        .min(Number.MIN_SAFE_INTEGER, translationsKeys.currencyInvalid)
        .max(Number.MAX_SAFE_INTEGER, translationsKeys.currencyInvalid)
        .required(translationsKeys.currencyRequired),
    budget: Yup.number()
        .transform((value, originalValue) => (originalValue === '' || originalValue === null ? null : value))
        .nullable()
        .min(0, translationsKeys.amountTooSmall)
        .notRequired(),
};
const incomeEdit = {
    incomeName: Yup.string().min(3, translationsKeys.nameTooShort).max(50, translationsKeys.nameTooLong).notRequired(),
    currencyId: Yup.number().notRequired(),
};
const publicNameEdit = {
    publicName: Yup.string()
        .min(3, translationsKeys.nameTooShort)
        .max(40, translationsKeys.publicNameTooLong)
        .required(translationsKeys.nameRequired),
};

const emailEdit = {
    email: Yup.string()
        .min(3, translationsKeys.emailInvalid)
        .max(50, translationsKeys.emailTooLong)
        .email(translationsKeys.emailInvalid)
        .required(translationsKeys.emailRequired),
};

const accountEdit = {
    amount: Yup.number()
        .min(Number.MIN_SAFE_INTEGER, translationsKeys.amountTooSmall)
        .max(Number.MAX_SAFE_INTEGER, translationsKeys.amountTooLarge)
        .notRequired(),
    accountName: Yup.string().min(3, translationsKeys.nameTooShort).max(50, translationsKeys.nameTooLong).notRequired(),
    currencyId: Yup.number().notRequired(),
};
const signUpConfirmation = {
    confirmationCode: Yup.string()
        .min(6, translationsKeys.codeTooShort)
        .max(8, translationsKeys.codeTooLong)
        .required(translationsKeys.codeRequired),
};

const login = {
    email: Yup.string()
        .required(translationsKeys.emailRequired)
        .max(50, translationsKeys.emailTooLong)
        .email(translationsKeys.emailInvalid),
    password: Yup.string()
        .required(translationsKeys.passwordRequired)
        .min(5, translationsKeys.passwordMinLength)
        .max(50, translationsKeys.passwordTooLong)
        .matches(/[A-Z]/, translationsKeys.passwordUppercase)
        .matches(/[a-z]/, translationsKeys.passwordLowercase)
        .matches(/[0-9]/, translationsKeys.passwordNumber)
        .matches(/[!@#$%^&*(),.?":{}|<>]/, translationsKeys.passwordSpecial),
};

const buildSignUpSchema = (locales: string[], currencies: string[]) => {
    return Yup.object({
        publicName: Yup.string()
            .required(translationsKeys.nameRequired)
            .min(3, translationsKeys.nameTooShort)
            .max(50, translationsKeys.nameTooLong),
        email: Yup.string()
            .required(translationsKeys.emailRequired)
            .max(50, translationsKeys.emailTooLong)
            .email(translationsKeys.emailInvalid),
        password: Yup.string()
            .required(translationsKeys.passwordRequired)
            .min(5, translationsKeys.passwordMinLength)
            .max(50, translationsKeys.passwordTooLong)
            .matches(/[A-Z]/, translationsKeys.passwordUppercase)
            .matches(/[a-z]/, translationsKeys.passwordLowercase)
            .matches(/[0-9]/, translationsKeys.passwordNumber)
            .matches(/[!@#$%^&*(),.?":{}|<>]/, translationsKeys.passwordSpecial),
        locale:
            locales.length > 0
                ? Yup.string().required(translationsKeys.localeRequired).oneOf(locales, translationsKeys.unsupportedLanguage)
                : Yup.string().required(translationsKeys.localeRequired),
        currency:
            currencies.length > 0
                ? Yup.string().required(translationsKeys.currencyRequired).oneOf(currencies, translationsKeys.unsupportedCurrency)
                : Yup.string().required(translationsKeys.currencyRequired),
    });
};

const forgotPasswordRequestSchema = Yup.object({
    email: Yup.string()
        .required(translationsKeys.emailRequired)
        .max(50, translationsKeys.emailTooLong)
        .email(translationsKeys.emailInvalid),
});

const forgotPasswordConfirmSchema = Yup.object({
    email: Yup.string()
        .required(translationsKeys.emailRequired)
        .max(50, translationsKeys.emailTooLong)
        .email(translationsKeys.emailInvalid),
    confirmationCode: Yup.string()
        .min(6, translationsKeys.codeTooShort)
        .max(8, translationsKeys.codeTooLong)
        .required(translationsKeys.codeRequired),
});

const forgotPasswordChangeSchema = Yup.object({
    newPassword: Yup.string()
        .required(translationsKeys.newPasswordRequired)
        .min(5, translationsKeys.passwordMinLength)
        .max(50, translationsKeys.passwordTooLong)
        .matches(/[A-Z]/, translationsKeys.passwordUppercase)
        .matches(/[a-z]/, translationsKeys.passwordLowercase)
        .matches(/[0-9]/, translationsKeys.passwordNumber)
        .matches(/[!@#$%^&*(),.?":{}|<>]/, translationsKeys.passwordSpecial),
    repeatPassword: Yup.string()
        .required(translationsKeys.repeatPasswordRequired)
        .oneOf([Yup.ref('newPassword')], translationsKeys.passwordsDoNotMatch),
});

const categoryEdit = {
    categoryName: Yup.string().min(3, translationsKeys.nameTooShort).max(50, translationsKeys.nameTooLong).notRequired(),
    currencyId: Yup.number().notRequired(),
    budget: Yup.number()
        .transform((value, originalValue) => (originalValue === '' || originalValue === null ? null : value))
        .nullable()
        .min(0, translationsKeys.amountTooSmall)
        .notRequired(),
};

const buildTransactionCreateSchema = ({
    sourceCurrencyId,
    currencyId,
}: {
    sourceCurrencyId: number | undefined;
    currencyId: number;
}) => {
    const now = new Date();
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);

    const transactionsCreate = {
        ...(currencyId !== sourceCurrencyId
            ? {
                  amountInCurrency: Yup.number()
                      .min(Number.MIN_SAFE_INTEGER, translationsKeys.amountTooSmall)
                      .max(Number.MAX_SAFE_INTEGER, translationsKeys.amountTooLarge),
                  sourceCurrencyId: Yup.number()
                      .min(Number.MIN_SAFE_INTEGER, translationsKeys.currencyInvalid)
                      .max(Number.MAX_SAFE_INTEGER, translationsKeys.currencyInvalid),
              }
            : {}),
        transactionTypeId: Yup.number()
            .oneOf(
                [TransactionType.Expense, TransactionType.Income, TransactionType.Transafer],
                translationsKeys.transactionTypeRequired,
            )
            .required(translationsKeys.transactionTypeRequired),
        amount: Yup.number()
            .min(Number.MIN_SAFE_INTEGER, translationsKeys.amountTooSmall)
            .max(Number.MAX_SAFE_INTEGER, translationsKeys.amountTooLarge),
        description: Yup.string()
            .notRequired()
            .min(3, translationsKeys.descriptionTooShort)
            .max(150, translationsKeys.descriptionTooLong),
        currencyId: Yup.number()
            .min(Number.MIN_SAFE_INTEGER, translationsKeys.currencyInvalid)
            .max(Number.MAX_SAFE_INTEGER, translationsKeys.currencyInvalid),
        createdAt: Yup.date().min(twentyYearsAgo, translationsKeys.dateTooOld).max(now, translationsKeys.dateInFuture),
        accountId: Yup.number().when('transactionTypeId', (transactionTypeId, schema) => {
            if ((transactionTypeId as unknown as TransactionType) === TransactionType.Transafer)
                return schema.required(translationsKeys.accountRequired);
            if ((transactionTypeId as unknown as TransactionType) === TransactionType.Expense)
                return schema.required(translationsKeys.accountRequired);
            if ((transactionTypeId as unknown as TransactionType) === TransactionType.Income)
                return schema.required(translationsKeys.accountRequired);
            return schema.notRequired();
        }),
        targetAccountId: Yup.number().when('transactionTypeId', {
            is: TransactionType.Transafer,
            then: (schema) => schema.required(translationsKeys.targetAccountRequired),
            otherwise: (schema) => schema.notRequired(),
        }),
        categoryId: Yup.number().when('transactionTypeId', {
            is: TransactionType.Expense,
            then: (schema) => schema.required(translationsKeys.categoryRequired),
            otherwise: (schema) => schema.notRequired(),
        }),
        incomeId: Yup.number().when('transactionTypeId', {
            is: TransactionType.Income,
            then: (schema) => schema.required(translationsKeys.incomeRequired),
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
        transactionTypeId: Yup.number()
            .oneOf(
                [TransactionType.Expense, TransactionType.Income, TransactionType.Transafer],
                translationsKeys.transactionTypeRequired,
            )
            .nullable(),
        amount: Yup.number()
            .min(0, translationsKeys.amountTooSmall)
            .max(Number.MAX_SAFE_INTEGER, translationsKeys.amountTooLarge)
            .notRequired(),

        description: Yup.string()
            .min(3, translationsKeys.descriptionTooShort)
            .max(150, translationsKeys.descriptionTooLong)
            .notRequired(),

        currencyId: Yup.number()
            .min(0, translationsKeys.currencyInvalid)
            .max(Number.MAX_SAFE_INTEGER, translationsKeys.currencyInvalid)
            .notRequired(),

        createdAt: Yup.date()
            .min(twentyYearsAgo, translationsKeys.dateTooOld)
            .max(now, translationsKeys.dateInFuture)
            .notRequired(),

        accountId: Yup.number().when('transactionTypeId', (transactionTypeId, schema) => {
            if ((transactionTypeId as unknown as TransactionType) === TransactionType.Transafer)
                return schema.required(translationsKeys.accountRequired);
            if ((transactionTypeId as unknown as TransactionType) === TransactionType.Expense)
                return schema.required(translationsKeys.accountRequired);
            if ((transactionTypeId as unknown as TransactionType) === TransactionType.Income)
                return schema.required(translationsKeys.accountRequired);
            return schema.notRequired();
        }),

        targetAccountId: Yup.number().when('transactionTypeId', {
            is: TransactionType.Transafer,
            then: (schema) => schema.required(translationsKeys.targetAccountRequired),
            otherwise: (schema) => schema.notRequired(),
        }),

        categoryId: Yup.number().when('transactionTypeId', {
            is: TransactionType.Expense,
            then: (schema) => schema.required(translationsKeys.categoryRequired),
            otherwise: (schema) => schema.notRequired(),
        }),

        incomeId: Yup.number().when('transactionTypeId', {
            is: TransactionType.Income,
            then: (schema) => schema.required(translationsKeys.incomeRequired),
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
const loginSchema = Yup.object(login);

const settingsChangePublicNameShema = Yup.object(publicNameEdit);

const settingsChangeEmailShema = Yup.object(emailEdit);
const settingsChangeEmailConfirmationShema = Yup.object(signUpConfirmation);

const passwordChange = {
    password: Yup.string().required(translationsKeys.currentPasswordRequired),
    newPassword: Yup.string()
        .required(translationsKeys.newPasswordRequired)
        .min(5, translationsKeys.passwordMinLength)
        .matches(/[A-Z]/, translationsKeys.passwordUppercase)
        .matches(/[a-z]/, translationsKeys.passwordLowercase)
        .matches(/[0-9]/, translationsKeys.passwordNumber)
        .matches(/[!@#$%^&*]/, translationsKeys.passwordSpecial),
};

const settingsChangePasswordSchema = Yup.object(passwordChange);
const settingsChangePasswordConfirmSchema = Yup.object(signUpConfirmation);

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
    settingsChangePublicNameShema,
    settingsChangeEmailShema,
    settingsChangeEmailConfirmationShema,
    settingsChangePasswordSchema,
    settingsChangePasswordConfirmSchema,
    loginSchema,
    buildSignUpSchema,
    forgotPasswordChangeSchema,
    forgotPasswordRequestSchema,
    forgotPasswordConfirmSchema,
};
