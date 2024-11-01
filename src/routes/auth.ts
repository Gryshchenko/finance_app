import express from 'express';

import { body } from 'express-validator';
import routesInputValidation from '../utils/validation/routesInputValidation';
import tokenVerify from '../middleware/tokenVerify';
import ensureGuest from '../middleware/ensureGuest';
import sessionVerify from '../middleware/sessionVerify';
import { AuthController } from 'src/controllers/AuthController';

const router = express.Router();

router.post('/logout', tokenVerify, sessionVerify, AuthController.logout);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     description: The /auth/login endpoint is designed to handle user authentication within our system. When a POST request is made to this endpoint with the necessary credentials (email and password), the API verifies the credentials against our user database. If the authentication is successful, the server issues a JWT (JSON Web Token) which is then securely returned to the client as a HTTP cookie. This token serves as proof of authentication and can be used for subsequent requests to other secure endpoints within the API.
 *      The response includes the user's unique identifier (`userId`), email, and activation status embedded within the `data` object of the response payload. If there is an error during authentication, such as invalid credentials or incomplete request data, the API provides a detailed error message using standard HTTP error response codes (e.g., 400 for bad request, 401 for unauthorized access).
 *      This endpoint is crucial for enabling secure access to our API, ensuring that user interactions are authenticated before allowing access to sensitive operations within the system.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 minimum: 5
 *                 maximum: 50
 *                 description: The user's email address
 *               password:
 *                 type: string
 *                 minimum: 5
 *                 maximum: 50
 *                 description: The user's password
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Successful authentication, returns user data and sets a JWT in cookies
 *         headers:
 *           Set-Cookie:
 *             description: Secure cookie with JWT token
 *             schema:
 *               type: string
 *               example: JWT=token; Path=/; HttpOnly; Secure; SameSite=None
 *         content:
 *           application/json:
 *             schema:
 *              allOf:
 *                   - $ref: '#/components/schemas/StandardResponse'
 *                   - type: object
 *                     properties:
 *                       _response:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: integer
 *                             example: 1
 *                             description: Status code representing the result of the operation (1 for success)
 *                           data:
 *                            - $ref: '#/components/schemas/UserClient'
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post(
    '/login',
    ensureGuest,
    routesInputValidation([body('password').isString().isLength({ max: 50 }), body('email').isString().isLength({ max: 50 })]),
    AuthController.login,
);

export default router;
