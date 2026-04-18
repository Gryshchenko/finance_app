import express from 'express';
import { UserStatus } from 'tenpercent/shared';

import { EmailConfirmationController } from 'controllers/EmailConfirmationController';
import tokenVerify from 'middleware/tokenVerify';
import userIdVerify from 'middleware/userIdVerify';
import userStatusVerify from 'middleware/userStatusVerify';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { validatePathConfirmationCodeProperty } from 'src/utils/validation/validatePathConfirmationCodeProperty';
import { validateQuery } from 'src/utils/validation/validateQuery';

const emailConfirmationRouter = express.Router({ mergeParams: true });

emailConfirmationRouter.use(tokenVerify, userIdVerify, userStatusVerify(UserStatus.NO_VERIFIED));

emailConfirmationRouter.post(
    '/resend',
    sanitizeRequestBody([]),
    validateQuery({}),
    routesInputValidation([]),
    EmailConfirmationController.resend,
);

emailConfirmationRouter.post(
    '/verify',
    sanitizeRequestBody(['confirmationCode']),
    validateQuery({}),
    routesInputValidation([validatePathConfirmationCodeProperty('confirmationCode')]),
    EmailConfirmationController.verify,
);

export default emailConfirmationRouter;
