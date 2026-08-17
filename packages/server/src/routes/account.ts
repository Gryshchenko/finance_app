import { AccountStatusType } from '@tenpercent/shared';
import express from 'express';

import { AccountController } from 'controllers/AccountController';
import {
    accountConvertValidationMessageToErrorCode,
    createAccountValidationRules,
    deleteAccountValidationRules,
    patchAccountValidationRules,
} from 'src/utils/validation/accountValidationRules';
import {
    boolRule,
    colorRule,
    currencyCodeRule,
    enumRule,
    iconRule,
    nameRule,
    numberRule,
    positionRule,
} from 'src/utils/validation/fieldRules';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { validatePathQueryProperty } from 'src/utils/validation/validatePathQueryProperty';
import { validateQuery } from 'src/utils/validation/validateQuery';

const accountRouter = express.Router({ mergeParams: true });
const accountsRouter = express.Router({ mergeParams: true });

/** Only a transition away from `Enable` may be requested; an account is created enabled. */
const statusRule = () => enumRule([AccountStatusType.Disable, AccountStatusType.Delete]);

accountRouter.post(
    '/',
    validateQuery({}),
    sanitizeRequestBody(
        {
            accountName: nameRule({ minLength: 3 }),
            amount: numberRule(),
            currencyCode: currencyCodeRule(),
            iconId: iconRule({ optional: false }),
            colorId: colorRule(),
        },
        accountConvertValidationMessageToErrorCode,
    ),
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
    sanitizeRequestBody({ keepData: boolRule() }, accountConvertValidationMessageToErrorCode),
    routesInputValidation(deleteAccountValidationRules, accountConvertValidationMessageToErrorCode),
    routesInputValidation([validatePathQueryProperty('accountId')]),
    AccountController.delete,
);

accountRouter.patch(
    '/:accountId',
    validateQuery({}),
    sanitizeRequestBody(
        {
            accountName: nameRule({ optional: true, minLength: 3 }),
            amount: numberRule({ optional: true }),
            status: statusRule(),
            iconId: iconRule(),
            colorId: colorRule(),
            position: positionRule(),
        },
        accountConvertValidationMessageToErrorCode,
    ),
    routesInputValidation(patchAccountValidationRules, accountConvertValidationMessageToErrorCode),
    routesInputValidation([validatePathQueryProperty('accountId')]),
    AccountController.patch,
);

accountsRouter.get('/', validateQuery({}), AccountController.gets);

export { accountRouter, accountsRouter };
