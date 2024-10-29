/**
 * @swagger
 * components:
 *   schemas:
 *     Currency:
 *       type: object
 *       properties:
 *         currencyCode:
 *           type: string
 *           nullable: true
 *           description: The code of the currency, e.g., 'USD', 'EUR'.
 *         currencyName:
 *           type: string
 *           nullable: true
 *           description: The name of the currency, e.g., 'United States Dollar', 'Euro'.
 *         symbol:
 *           type: string
 *           nullable: true
 *           description: The symbol of the currency, e.g., '$', '€'.
 *       description: Optional currency details associated with the user.
 *     Profile:
 *       type: object
 *       properties:
 *         locale:
 *           type: string
 *           nullable: true
 *           description: Locale setting of the user, e.g., 'en-US'.
 *       description: User's profile information including locale settings.
 *     UserClient:
 *       type: object
 *       required:
 *         - userId
 *         - email
 *         - status
 *         - profile
 *       properties:
 *         userId:
 *           type: integer
 *           format: int64
 *           description: Unique identifier for the user.
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the user.
 *         status:
 *           $ref: '#/components/schemas/UserStatus'
 *         currency:
 *           $ref: '#/components/schemas/Currency'
 *         profile:
 *           $ref: '#/components/schemas/Profile'
 *         additionalInfo:
 *           type: object
 *           additionalProperties: true
 *           description: Additional information as a key-value pair structure.
 *       description: Represents a client-side representation of a user.
 *     UserStatus:
 *       type: string
 *       enum:
 *         - Active
 *         - Inactive
 *         - Pending
 *       description: Enumeration of possible user statuses. *
 *     StandardResponse:
 *       type: object
 *       properties:
 *         _response:
 *           type: object
 *           properties:
 *             status:
 *               type: integer
 *               description: Status code representing the result of the operation (1 - OK, 2 - INTERNAL, 3 - EXTERNAL) error
 *             data:
 *               type: object  # This will be a placeholder, defined in detail at the endpoint level
 *               description: Container for any data returned by the operation
 *             errors:
 *               type: array
 *               description: List of errors encountered during the operation
 *               items:
 *                 type: object
 *                 properties:
 *                   errorCode:
 *                     type: integer
 *                     description: Numeric code representing the specific error
 *   responses:
 *     SuccessfulResponse:
 *       description: A standard response for successful API calls
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StandardResponse'
 *     ErrorResponse:
 *       description: A standard error response for any failed API call
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StandardResponse'
 */
