import express from 'express';

import { body } from 'express-validator';
import routesInputValidation from '../utils/validation/routesInputValidation';
import tokenVerify from '../middleware/tokenVerify';
import ensureGuest from '../middleware/ensureGuest';
import sessionVerify from '../middleware/sessionVerify';
import { AuthController } from 'src/controllers/AuthController';

const router = express.Router();

router.post('/logout', tokenVerify, sessionVerify, AuthController.logout);

router.post(
    '/login',
    ensureGuest,
    routesInputValidation([body('password').isString().isLength({ max: 50 }), body('email').isString().isLength({ max: 50 })]),
    AuthController.login,
);

export default router;
