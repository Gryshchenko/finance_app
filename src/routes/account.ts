import { AccountController } from 'controllers/AccountController';
import express from 'express';
import { sanitizeRequestQuery } from 'src/utils/validation/sanitizeRequestQuery';

const accountRouter = express.Router({ mergeParams: true });

accountRouter.get('/:accountId', sanitizeRequestQuery([]), AccountController.get);

accountRouter.delete('/:accountId', sanitizeRequestQuery([]));

accountRouter.patch('/:accountId', sanitizeRequestQuery([]));

export default accountRouter;
