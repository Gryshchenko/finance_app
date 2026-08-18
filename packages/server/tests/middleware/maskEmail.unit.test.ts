import { maskEmail } from 'src/utils/maskPII';

describe('maskEmail', () => {
    it('keeps the domain and the first and last character of the local part', () => {
        expect(maskEmail('volodymyr@example.com')).toBe('v*******r@example.com');
    });

    it('masks a short local part entirely rather than exposing it', () => {
        expect(maskEmail('ab@example.com')).toBe('**@example.com');
    });

    it('leaves nothing recoverable for an empty or malformed value', () => {
        expect(maskEmail(undefined)).toBe('<empty>');
        expect(maskEmail('')).toBe('<empty>');
        expect(maskEmail('not-an-email')).toBe('<invalid>');
        expect(maskEmail('@example.com')).toBe('<invalid>');
    });

    it('splits on the last @, so an embedded @ cannot be mistaken for the domain boundary', () => {
        expect(maskEmail('a@b@example.com')).toBe('a*b@example.com');
    });
});
