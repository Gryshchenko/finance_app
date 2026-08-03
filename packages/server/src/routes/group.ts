import express from 'express';

import { GroupController } from 'controllers/GroupController';
import {
    createGroupValidationRules,
    groupConvertValidationMessageToErrorCode,
    patchGroupValidationRules,
} from 'src/utils/validation/groupValidationRules';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { validatePathQueryProperty } from 'src/utils/validation/validatePathQueryProperty';
import { validateQuery } from 'src/utils/validation/validateQuery';

const groupRouter = express.Router({ mergeParams: true });
const groupsRouter = express.Router({ mergeParams: true });

groupRouter.post(
    '/',
    validateQuery({}),
    sanitizeRequestBody(['groupName', 'description', 'groupSharedItems']),
    routesInputValidation(createGroupValidationRules, groupConvertValidationMessageToErrorCode),
    GroupController.post,
);

groupRouter.get(
    '/:userGroupId',
    validateQuery({}),
    routesInputValidation([validatePathQueryProperty('userGroupId')]),
    GroupController.get,
);

groupRouter.patch(
    '/:userGroupId',
    validateQuery({}),
    sanitizeRequestBody(['groupName', 'description', 'groupSharedItems']),
    routesInputValidation(patchGroupValidationRules, groupConvertValidationMessageToErrorCode),
    routesInputValidation([validatePathQueryProperty('userGroupId')]),
    GroupController.patch,
);

groupRouter.delete(
    '/:userGroupId',
    validateQuery({}),
    sanitizeRequestBody([]),
    routesInputValidation([validatePathQueryProperty('userGroupId')]),
    GroupController.delete,
);

groupsRouter.get('/shareable-items', validateQuery({}), GroupController.getShareableItems);

groupsRouter.get('/', validateQuery({}), GroupController.gets);

export { groupRouter, groupsRouter };
