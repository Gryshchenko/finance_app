const { body } = require('express-validator');

interface IOptions {
    max: number;
    onlyASCII: boolean;
    escapeHTML: boolean;
    optional: boolean;
}

function createSignupValidationRules(field: string, type: string, options: Partial<IOptions> = {}) {
    const validators = [body(field)];

    if (options.onlyASCII) {
        validators.push(
            body(field)
                .matches(/^[\x00-\x7F]*$/)
                .withMessage(`Field ${field} must contain only characters`),
        );
    }

    if (options.escapeHTML) {
        validators.push(body(field).escape());
    }

    if (type === 'email') {
        validators.push(body(field).isEmail());
    } else if (type === 'password') {
        validators.push(body(field).isStrongPassword());
    } else if (type === 'number') {
        validators.push(body(field).isNumeric());
    } else if (type === 'string') {
        validators.push(body(field).isString());
    }

    if (options.max) {
        validators.push(body(field).isLength({ max: options.max }));
    }

    if (options.optional) {
        validators[0] = body(field).optional({ nullable: true, checkFalsy: true });
    }

    return validators;
}

const signupValidationRules = [
    ...createSignupValidationRules('password', 'password', { max: 30, onlyASCII: true }),
    ...createSignupValidationRules('email', 'email', { max: 30, onlyASCII: true }),
    // ...createSignupValidationRules('locale', 'string', { max: 6, optional: true, onlyASCII: true, escapeHTML: true }),
];

export default signupValidationRules;
