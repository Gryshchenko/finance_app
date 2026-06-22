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
    targetAccountSameAsSource: 'validation:targetAccountSameAsSource',
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

// Strict currency validation: a code must be one of the currencies available from
// the (public) config. Falls back to a loose length check while the list is still loading.
const buildCurrencyCodeSchema = (currencyCodes: string[], required = false) => {
    const base =
        currencyCodes.length > 0
            ? Yup.string().oneOf(currencyCodes, translationsKeys.unsupportedCurrency)
            : Yup.string().max(10, translationsKeys.currencyInvalid);
    return required ? base.required(translationsKeys.currencyRequired) : base;
};

const buildIncomeCreateSchema = (currencyCodes: string[] = []) =>
    Yup.object({
        incomeName: Yup.string()
            .required(translationsKeys.nameRequired)
            .min(3, translationsKeys.nameTooShort)
            .max(50, translationsKeys.nameTooLong),
        currencyCode: buildCurrencyCodeSchema(currencyCodes, true),
        iconId: Yup.string().required(translationsKeys.iconRequired),
    });

const buildAccountCreateSchema = (currencyCodes: string[] = []) =>
    Yup.object({
        amount: Yup.number()
            .min(Number.MIN_SAFE_INTEGER, translationsKeys.amountTooSmall)
            .max(Number.MAX_SAFE_INTEGER, translationsKeys.amountTooLarge),
        accountName: Yup.string()
            .required(translationsKeys.nameRequired)
            .min(3, translationsKeys.nameTooShort)
            .max(50, translationsKeys.nameTooLong),
        currencyCode: buildCurrencyCodeSchema(currencyCodes, true),
    });

const buildCategoryCreateSchema = (currencyCodes: string[] = []) =>
    Yup.object({
        categoryName: Yup.string()
            .required(translationsKeys.nameRequired)
            .min(3, translationsKeys.nameTooShort)
            .max(50, translationsKeys.nameTooLong),
        currencyCode: buildCurrencyCodeSchema(currencyCodes, true),
        budget: Yup.number()
            .transform((value, originalValue) => (originalValue === '' || originalValue === null ? null : value))
            .nullable()
            .min(0, translationsKeys.amountTooSmall)
            .notRequired(),
    });
const incomeEdit = {
    incomeName: Yup.string().min(3, translationsKeys.nameTooShort).max(50, translationsKeys.nameTooLong).notRequired(),
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
    budget: Yup.number()
        .transform((value, originalValue) => (originalValue === '' || originalValue === null ? null : value))
        .nullable()
        .min(0, translationsKeys.amountTooSmall)
        .notRequired(),
};

const buildTransactionCreateSchema = ({
    targetCurrencyCode,
    currencyCode,
    currencyCodes,
}: {
    targetCurrencyCode: string | undefined;
    currencyCode: string;
    currencyCodes: string[];
}) => {
    const now = new Date();
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);

    const transactionsCreate = {
        ...(currencyCode !== targetCurrencyCode
            ? {
                  targetAmount: Yup.number()
                      .min(Number.MIN_SAFE_INTEGER, translationsKeys.amountTooSmall)
                      .max(Number.MAX_SAFE_INTEGER, translationsKeys.amountTooLarge),
                  targetCurrencyCode: buildCurrencyCodeSchema(currencyCodes),
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
        currencyCode: buildCurrencyCodeSchema(currencyCodes),
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
            then: (schema) =>
                schema
                    .required(translationsKeys.targetAccountRequired)
                    .test('not-same-as-source', translationsKeys.targetAccountSameAsSource, function (value) {
                        return value !== this.parent.accountId;
                    }),
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
const buildTransactionEditSchema = ({
    targetCurrencyCode,
    currencyCode,
    currencyCodes,
}: {
    targetCurrencyCode: string | undefined;
    currencyCode: string;
    currencyCodes: string[];
}) => {
    const now = new Date();
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);

    const transactionEdit = {
        ...(currencyCode !== targetCurrencyCode
            ? {
                  targetAmount: Yup.number()
                      .min(Number.MIN_SAFE_INTEGER, translationsKeys.amountTooSmall)
                      .max(Number.MAX_SAFE_INTEGER, translationsKeys.amountTooLarge),
                  targetCurrencyCode: buildCurrencyCodeSchema(currencyCodes),
              }
            : {}),
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

        currencyCode: buildCurrencyCodeSchema(currencyCodes),

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
            then: (schema) =>
                schema
                    .required(translationsKeys.targetAccountRequired)
                    .test('not-same-as-source', translationsKeys.targetAccountSameAsSource, function (value) {
                        return value !== this.parent.accountId;
                    }),
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

const incomeEditSchema = Yup.object(incomeEdit);
const accountEditSchema = Yup.object(accountEdit);
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
    buildIncomeCreateSchema,
    accountEditSchema,
    buildAccountCreateSchema,
    categoryEditSchema,
    buildCategoryCreateSchema,
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
