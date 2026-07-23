import { UserStatus } from '@tenpercent/shared';
import express from 'express';

import { UserController } from 'controllers/UserController';
import userIdVerify from 'middleware/userIdVerify';
import userStatusVerify from 'middleware/userStatusVerify';
import balance from 'routes/balance';
import { categoriesRouter, categoryRouter } from 'routes/category';
import goalSelectionRouter from 'routes/goalSelectionRouter';
import { groupRouter, groupsRouter } from 'routes/group';
import { incomeRouter, incomesRouter } from 'routes/income';
import { sharingRouter } from 'routes/sharing';
import { statsRouter } from 'routes/stats';
import tutorialsRouter from 'routes/tutorialsRouter';
import { accountsRouter, accountRouter } from 'src/routes/account';
import overview from 'src/routes/overview';
import profile from 'src/routes/profile';
import { transactionsRouter, transactionRouter } from 'src/routes/transaction';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { validatePathQueryProperty } from 'src/utils/validation/validatePathQueryProperty';
import { validateQuery } from 'src/utils/validation/validateQuery';

import tokenVerify from '../middleware/tokenVerify';

const userRouter = express.Router({ mergeParams: true });

userRouter.use(tokenVerify, userStatusVerify(UserStatus.ACTIVE));

userRouter.get(
    '/:userId',
    userIdVerify,
    routesInputValidation([validatePathQueryProperty('userId')]),
    sanitizeRequestBody([]),
    validateQuery({}),
    UserController.get,
);

userRouter.use('/:userId/profile', userIdVerify, routesInputValidation([validatePathQueryProperty('userId')]), profile);

userRouter.use('/:userId/overview', userIdVerify, routesInputValidation([validatePathQueryProperty('userId')]), overview);

userRouter.use(
    '/:userId/transaction',
    userIdVerify,
    routesInputValidation([validatePathQueryProperty('userId')]),
    transactionRouter,
);

userRouter.use(
    '/:userId/transactions',
    userIdVerify,
    routesInputValidation([validatePathQueryProperty('userId')]),
    transactionsRouter,
);

userRouter.use('/:userId/account', userIdVerify, routesInputValidation([validatePathQueryProperty('userId')]), accountRouter);

userRouter.use('/:userId/accounts', userIdVerify, routesInputValidation([validatePathQueryProperty('userId')]), accountsRouter);

userRouter.use('/:userId/income', userIdVerify, routesInputValidation([validatePathQueryProperty('userId')]), incomeRouter);

userRouter.use('/:userId/incomes', userIdVerify, routesInputValidation([validatePathQueryProperty('userId')]), incomesRouter);

userRouter.use('/:userId/category', userIdVerify, routesInputValidation([validatePathQueryProperty('userId')]), categoryRouter);

userRouter.use(
    '/:userId/categories',
    userIdVerify,
    routesInputValidation([validatePathQueryProperty('userId')]),
    categoriesRouter,
);

userRouter.use('/:userId/category', userIdVerify, routesInputValidation([validatePathQueryProperty('userId')]), categoryRouter);

userRouter.use('/:userId/sharing', userIdVerify, routesInputValidation([validatePathQueryProperty('userId')]), sharingRouter);

userRouter.use('/:userId/group', userIdVerify, routesInputValidation([validatePathQueryProperty('userId')]), groupRouter);

userRouter.use('/:userId/groups', userIdVerify, routesInputValidation([validatePathQueryProperty('userId')]), groupsRouter);

userRouter.use('/:userId/stats', userIdVerify, routesInputValidation([validatePathQueryProperty('userId')]), statsRouter);

userRouter.use('/:userId/balance', userIdVerify, routesInputValidation([validatePathQueryProperty('userId')]), balance);

userRouter.use('/:userId/tutorials', userIdVerify, routesInputValidation([validatePathQueryProperty('userId')]), tutorialsRouter);

userRouter.use('/:userId/goals', userIdVerify, routesInputValidation([validatePathQueryProperty('userId')]), goalSelectionRouter);

export default userRouter;
