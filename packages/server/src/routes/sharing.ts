import express from 'express';

import { SharingController } from 'controllers/SharingController';
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
sharingRouter.post(
    '/invite',
    validateQuery({}),
    sanitizeRequestBody(['email', 'userGroupId']),
    routesInputValidation(inviteUserValidationRules, sharingConvertValidationMessageToErrorCode),
    SharingController.invite,
);

sharingRouter.post(
    '/connection/:connectionId/accept',
    validateQuery({}),
    sanitizeRequestBody(['userGroupId']),
    routesInputValidation(acceptRequestValidationRules, sharingConvertValidationMessageToErrorCode),
    routesInputValidation([validatePathQueryProperty('connectionId')]),
    SharingController.accept,
);

sharingRouter.post(
    '/connection/:connectionId/decline',
    validateQuery({}),
    sanitizeRequestBody([]),
    routesInputValidation([validatePathQueryProperty('connectionId')]),
    SharingController.decline,
);

sharingRouter.patch(
    '/connection/:connectionId',
    validateQuery({}),
    sanitizeRequestBody(['userGroupId']),
    routesInputValidation(patchMemberValidationRules, sharingConvertValidationMessageToErrorCode),
    routesInputValidation([validatePathQueryProperty('connectionId')]),
    SharingController.patchMember,
);

sharingRouter.delete(
    '/connection/:connectionId',
    validateQuery({}),
    sanitizeRequestBody([]),
    routesInputValidation([validatePathQueryProperty('connectionId')]),
    SharingController.deleteMember,
);

export { sharingRouter };
