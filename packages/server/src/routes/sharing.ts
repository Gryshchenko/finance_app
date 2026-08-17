import express from 'express';

import { SharingController } from 'controllers/SharingController';
import { emailRule, idRule } from 'src/utils/validation/fieldRules';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import {
    acceptRequestValidationRules,
    inviteUserValidationRules,
    patchMemberValidationRules,
    sharingConvertValidationMessageToErrorCode,
} from 'src/utils/validation/sharingValidationRules';
import { validatePathQueryProperty } from 'src/utils/validation/validatePathQueryProperty';
import { validateQuery } from 'src/utils/validation/validateQuery';

const sharingRouter = express.Router({ mergeParams: true });

sharingRouter.get('/connections', validateQuery({}), SharingController.getConnections);

sharingRouter.get('/connections/pending', validateQuery({}), SharingController.getPendingRequests);

sharingRouter.get('/connections/sent', validateQuery({}), SharingController.getSentRequests);

sharingRouter.get(
    '/connections/:connectionId',
    validateQuery({}),
    // This was the one connection route that read `:connectionId` without validating it.
    routesInputValidation([validatePathQueryProperty('connectionId')]),
    SharingController.getConnection,
);

sharingRouter.post(
    '/invite',
    validateQuery({}),
    sanitizeRequestBody(
        { email: emailRule({ maxLength: 100 }), userGroupId: idRule({ optional: false }) },
        sharingConvertValidationMessageToErrorCode,
    ),
    routesInputValidation(inviteUserValidationRules, sharingConvertValidationMessageToErrorCode),
    SharingController.invite,
);

sharingRouter.post(
    '/connection/:connectionId/accept',
    validateQuery({}),
    sanitizeRequestBody({ userGroupId: idRule() }, sharingConvertValidationMessageToErrorCode),
    routesInputValidation(acceptRequestValidationRules, sharingConvertValidationMessageToErrorCode),
    routesInputValidation([validatePathQueryProperty('connectionId')]),
    SharingController.accept,
);

sharingRouter.post(
    '/connection/:connectionId/decline',
    validateQuery({}),
    sanitizeRequestBody({}),
    routesInputValidation([validatePathQueryProperty('connectionId')]),
    SharingController.decline,
);

sharingRouter.patch(
    '/connection/:connectionId/owner',
    validateQuery({}),
    sanitizeRequestBody({ userGroupId: idRule({ optional: false }) }, sharingConvertValidationMessageToErrorCode),
    routesInputValidation(patchMemberValidationRules, sharingConvertValidationMessageToErrorCode),
    routesInputValidation([validatePathQueryProperty('connectionId')]),
    SharingController.patchOwner,
);

sharingRouter.patch(
    '/connection/:connectionId/member',
    validateQuery({}),
    sanitizeRequestBody({ userGroupId: idRule({ optional: false }) }, sharingConvertValidationMessageToErrorCode),
    routesInputValidation(patchMemberValidationRules, sharingConvertValidationMessageToErrorCode),
    routesInputValidation([validatePathQueryProperty('connectionId')]),
    SharingController.patchMember,
);

sharingRouter.delete(
    '/connection/:connectionId',
    validateQuery({}),
    sanitizeRequestBody({}),
    routesInputValidation([validatePathQueryProperty('connectionId')]),
    SharingController.deleteMember,
);

sharingRouter.delete(
    '/connection/:connectionId/leave',
    validateQuery({}),
    sanitizeRequestBody({}),
    routesInputValidation([validatePathQueryProperty('connectionId')]),
    SharingController.leave,
);

export { sharingRouter };
