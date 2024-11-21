import express from 'express';
import sessionVerify from '../middleware/sessionVerify';
import tokenVerify from '../middleware/tokenVerify';
import { body } from 'express-validator';
import { ProfileController } from 'controllers/ProfileController';
import overview from 'src/routes/overview';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { param } from 'express-validator';

const router = express.Router({ mergeParams: true });

router.use(tokenVerify, sessionVerify);

const userIdValidator = param('userId').isNumeric().isInt({ min: 0, max: Number.MAX_SAFE_INTEGER });

router.get('/:userId/profile', routesInputValidation([userIdValidator]), ProfileController.profile);

router.get(
    '/:userId/profile/confirm-email',
    routesInputValidation([body('code').isNumeric().isInt({ min: 0, max: 99999999 })]),
    ProfileController.confirmEmail,
);

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
router.get('/:userId/overview', routesInputValidation([userIdValidator]), overview);

export default router;
