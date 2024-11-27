import express from 'express';
import sessionVerify from '../middleware/sessionVerify';
import tokenVerify from '../middleware/tokenVerify';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { param } from 'express-validator';
import overview from 'src/routes/overview';
import profile from 'src/routes/profile';
import transaction from 'src/routes/transaction';
import userIdVerify from 'middleware/userIdVerify';

const userRouter = express.Router({ mergeParams: true });

const userIdValidator = param('userId')
    .isNumeric()
    .withMessage(`Field userId must be a numeric value`)
    .bail()
    .isInt({ min: 0, max: Number.MAX_SAFE_INTEGER })
    .withMessage(`Field userId must be a numeric value`);

userRouter.use(tokenVerify, sessionVerify);

userRouter.use('/:userId/profile', userIdVerify, routesInputValidation([userIdValidator]), profile);

userRouter.use('/:userId/overview', userIdVerify, routesInputValidation([userIdValidator]), overview);

userRouter.use('/:userId/transaction', userIdVerify, routesInputValidation([userIdValidator]), transaction);

// router.post('/request-resend-confirmation', async (req: Request, res: Response) => {});
// router.post(
//     '/reset-password',
//     routesInputValidation([body('password').isStrongPassword(), body('newPassword').isStrongPassword()]),
// );
// router.post(
//     '/request-mail-change',
//     routesInputValidation([body('email').isEmail()]),
// );
// router.post(
//     '/request-mail-confirmation',
//     routesInputValidation([body('email').isEmail(), body('code').isNumeric()]),
// );

export default userRouter;
