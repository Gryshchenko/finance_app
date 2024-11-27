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
 *           description: The symbol of the currency, e.g., $, €.
 *       description: Optional currency details associated with the user.
 *     Profile:
 *       type: object
 *       required:
 *         - profileId
 *         - userId
 *         - userName
 *         - currencyId
 *         - locale
 *         - mailConfirmed
 *       properties:
 *         profileId:
 *           type: integer
 *           description: Unique identifier for the profile.
 *           example: 123
 *         userId:
 *           type: integer
 *           description: ID of the user associated with the profile.
 *           example: 42
 *         userName:
 *           type: string
 *           description: Name of the user.
 *           example: "John Doe"
 *         currencyId:
 *           type: integer
 *           description: Unique identifier for the currency.
 *           example: 840
 *         locale:
 *           type: string
 *           enum:
 *             - en-US
 *             - fr-FR
 *             - es-ES
 *           description: User's locale setting.
 *           example: "en-US"
 *         mailConfirmed:
 *           type: boolean
 *           description: Indicates whether the user's email is confirmed.
 *           example: true
 *         additionInfo:
 *           type: object
 *           additionalProperties: true
 *           description: Additional information about the user as key-value pairs.
 *           example:
 *             someKey: "someValue"
 *             anotherKey: 123
 *         currencyCode:
 *           type: string
 *           description: Currency code, e.g., USD, EUR.
 *           example: "USD"
 *         currencyName:
 *           type: string
 *           description: Full name of the currency.
 *           example: "United States Dollar"
 *         symbol:
 *           type: string
 *           description: Symbol of the currency.
 *           example: "$"
 *       description: Profile information of a user, including locale, currency, and additional details.
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
 *       description: Enumeration of possible user statuses.
 *     StandardResponse:
 *       type: object
 *       properties:
 *         _response:
 *           type: object
 *           properties:
 *             status:
 *               type: integer
 *               description: Status code representing the result of the operation (1 - OK, 2 - INTERNAL, 3 - EXTERNAL).
 *             data:
 *               type: object
 *               description: Container for any data returned by the operation.
 *             errors:
 *               type: array
 *               description: List of errors encountered during the operation.
 *               items:
 *                 type: object
 *                 properties:
 *                   errorCode:
 *                     type: integer
 *                     description: Numeric code representing the specific error.
 *     IOverview:
 *       type: object
 *       properties:
 *         accounts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IAccount'
 *           description: List of accounts.
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ICategory'
 *           description: List of categories.
 *         incomes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IIncome'
 *           description: List of incomes.
 *     IAccount:
 *       type: object
 *       properties:
 *         accountId:
 *           type: integer
 *           description: Unique identifier for the account.
 *           example: 1
 *         userId:
 *           type: integer
 *           description: ID of the user who owns the account.
 *           example: 42
 *         accountName:
 *           type: string
 *           description: Name of the account.
 *           example: "Main Savings Account"
 *         amount:
 *           type: number
 *           description: Account balance.
 *           example: 1500.75
 *         currencyId:
 *           type: integer
 *           description: Unique identifier for the currency.
 *           example: 840
 *         currencyCode:
 *           type: string
 *           description: Currency code (e.g., USD, EUR).
 *           example: "USD"
 *         currencySymbol:
 *           type: string
 *           description: Currency symbol.
 *           example: "$"
 *     ICategory:
 *       type: object
 *       properties:
 *         value:
 *           type: string
 *           description: Category value.
 *           example: "Groceries"
 *     IIncome:
 *       type: object
 *       properties:
 *         incomeId:
 *           type: integer
 *           description: Unique identifier for the income.
 *           example: 10
 *         userId:
 *           type: integer
 *           description: ID of the user associated with the income.
 *           example: 42
 *         incomeName:
 *           type: string
 *           description: Name of the income source.
 *           example: "Salary"
 *         currencyId:
 *           type: integer
 *           description: Unique identifier for the currency.
 *           example: 840
 *   responses:
 *     SuccessfulResponse:
 *       description: A standard response for successful API calls.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StandardResponse'
 *     ErrorResponse:
 *       description: A standard error response for any failed API call.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StandardResponse'
 */
