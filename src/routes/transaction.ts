import { TransactionController } from 'controllers/TransactionController';
import express from 'express';
import createTransactionValidationRules, {
    transactionConvertValidationMessageToErrorCode,
} from 'src/utils/validation/createTransactionValidationRules';
import routesInputValidation from 'src/utils/validation/routesInputValidation';

const transactionRouter = express.Router({ mergeParams: true });

/**
 * @swagger
 * /{userId}/transaction:
 *   post:
 *     description: This endpoint allows the active user to create a new transaction.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               incomeId:
 *                 type: number
 *                 description: The ID of the income associated with the transaction.
 *               accountId:
 *                 type: number
 *                 description: The ID of the account for the transaction.
 *               currencyId:
 *                 type: number
 *                 description: The ID of the currency for the transaction.
 *               transactionTypeId:
 *                 type: number
 *                 description: The ID of the transaction type.
 *               amount:
 *                 type: number
 *                 description: The amount of the transaction.
 *               description:
 *                 type: string
 *                 description: A description for the transaction.
 *             required:
 *               - currencyId
 *               - transactionTypeId
 *               - amount
 *               - description
 *     responses:
 *       200:
 *         description: Successful authentication, returns user data.
 *         headers:
 *           Set-Cookie:
 *             description: Secure cookie with JWT token.
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
 *                           description: Status code representing the result of the operation (1 for success).
 *                         data:
 *                           type: object
 *                           properties:
 *                             transactionId:
 *                               type: integer
 *                               example: 1
 *                               description: The ID of the transaction.
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 */
transactionRouter.post(
    '/',
    routesInputValidation(createTransactionValidationRules, transactionConvertValidationMessageToErrorCode),
    TransactionController.create,
);

transactionRouter.get('/:transactionId');

transactionRouter.get('/:transactionId');

transactionRouter.delete('/:transactionId');

transactionRouter.patch('/:transactionId');

export default transactionRouter;
