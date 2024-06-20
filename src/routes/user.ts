import express from 'express';
import sessionVerify from '../middleware/sessionVerify';
import tokenVerify from '../middleware/tokenVerify';
import profile from 'src/routes/profile';
import overview from 'src/routes/overview';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { param } from 'express-validator';

const router = express.Router({ mergeParams: true });

router.use(tokenVerify, sessionVerify);

router.get('/:userId', () => null);

const userIdValidator = param('userId').isNumeric().isInt({ min: 0, max: Number.MAX_SAFE_INTEGER });

router.use('/:userId/profile', routesInputValidation([userIdValidator]), profile);

router.use('/:userId/overview', routesInputValidation([userIdValidator]), overview);

export default router;
