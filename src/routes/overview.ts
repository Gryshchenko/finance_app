import express from 'express';
import { OverviewController } from 'src/controllers/OverviewController';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { sanitizeRequestQuery } from 'src/utils/validation/sanitizeRequestQuery';

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /{userId}/overview:
 *   get:
 *     description: Retrieves the overview of a specific user by their ID. The response is a JSON object containing user data and additional information.
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: ID of the user
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Successful authentication, returns user data
 *         headers:
 *           Set-Cookie:
 *             description: Secure cookie with JWT token
 *             schema:
 *               type: string
 *               example: JWT=token; Path=/; HttpOnly; Secure; SameSite=None
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     _response:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: integer
 *                           example: 1
 *                           description: Status code representing the result of the operation (1 for success)
 *                         data:
 *                           $ref: '#/components/schemas/IOverview'
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/', sanitizeRequestQuery([]), sanitizeRequestBody([]), OverviewController.overview);

export default router;
