import { VALID_SHARED_ITEM_TYPES } from '@tenpercent/shared';
import express from 'express';

import { GroupController } from 'controllers/GroupController';
import { arrayRule, boolRule, enumRule, idRule, nameRule, objectRule, stringRule } from 'src/utils/validation/fieldRules';
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

/**
 * Items a group shares. This had no validation rule at all: the array went from the body
 * into `syncSharedItems`, so `id` and `type` reached the shared-item tables unchecked.
 */
const groupSharedItemsRule = () =>
    arrayRule(
        objectRule(
            {
                id: idRule({ optional: false }),
                type: enumRule(VALID_SHARED_ITEM_TYPES, { optional: false }),
                name: nameRule({ optional: true }),
                isShared: boolRule({ optional: false }),
            },
            { optional: false },
        ),
    );

const groupBodySchema = (optionalName: boolean) => ({
    groupName: nameRule({ optional: optionalName }),
    description: stringRule({ optional: true, maxLength: 256 }),
    groupSharedItems: groupSharedItemsRule(),
});

groupRouter.post(
    '/',
    validateQuery({}),
    sanitizeRequestBody(groupBodySchema(false), groupConvertValidationMessageToErrorCode),
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
    sanitizeRequestBody(groupBodySchema(true), groupConvertValidationMessageToErrorCode),
    routesInputValidation(patchGroupValidationRules, groupConvertValidationMessageToErrorCode),
    routesInputValidation([validatePathQueryProperty('userGroupId')]),
    GroupController.patch,
);

groupRouter.delete(
    '/:userGroupId',
    validateQuery({}),
    sanitizeRequestBody({}),
    routesInputValidation([validatePathQueryProperty('userGroupId')]),
    GroupController.delete,
);

groupsRouter.get('/shareable-items', validateQuery({}), GroupController.getShareableItems);

groupsRouter.get('/', validateQuery({}), GroupController.gets);

export { groupRouter, groupsRouter };
