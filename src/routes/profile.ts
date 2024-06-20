import express from 'express';
import { body } from 'express-validator';
import sessionVerify from 'middleware/sessionVerify';
import tokenVerify from 'middleware/tokenVerify';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { ProfileController } from 'controllers/ProfileController';

const router = express.Router({ mergeParams: true });

router.use(tokenVerify, sessionVerify);

router.get('/', ProfileController.profile);

router.post(
    '/confirm-email',
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
export default router;
