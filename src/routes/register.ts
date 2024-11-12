import express from 'express';
import signupValidationRules from 'src/utils/validation/signupValidationRules';
import routesInputValidation from '../utils/validation/routesInputValidation';
import { RegisterController } from 'src/controllers/RegisterController';

const router = express.Router();

router.post('/signup', routesInputValidation(signupValidationRules), RegisterController.signup);

export default router;
