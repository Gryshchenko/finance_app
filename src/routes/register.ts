import express from 'express';
import signupValidationRules from 'src/utils/validation/signupValidationRules';
import ensureGuest from '../middleware/ensureGuest';
import routesInputValidation from '../utils/validation/routesInputValidation';
import { RegisterController } from 'src/controllers/RegisterController';

const router = express.Router();

router.post('/signup', ensureGuest, routesInputValidation(signupValidationRules), RegisterController.signup);

export default router;
