import { ConfirmationHelper } from 'src/services/confirmation/ConfirmationHelper';
import { FIELD_LIMITS } from 'src/utils/validation/fieldRules';

describe('ConfirmationHelper.generateCode', () => {
    const SAMPLES = 50000;
    const codes = Array.from({ length: SAMPLES }, () => ConfirmationHelper.generateCode());

    it('always produces exactly 8 digits, inside the range the validator accepts', () => {
        for (const code of codes) {
            expect(String(code)).toHaveLength(8);
            expect(code).toBeGreaterThanOrEqual(FIELD_LIMITS.CONFIRMATION_CODE_MIN);
            expect(code).toBeLessThanOrEqual(FIELD_LIMITS.CONFIRMATION_CODE_MAX);
        }
    });

    it('spreads codes over the whole range - the old version could not exceed 42949672', () => {
        expect(codes.some((code) => code > 42949672)).toBe(true);
    });

    it('draws every leading digit about equally often', () => {
        const counts = new Map<string, number>();
        for (const code of codes) {
            const digit = String(code)[0];
            counts.set(digit, (counts.get(digit) ?? 0) + 1);
        }
        const expected = SAMPLES / 9;
        for (let digit = 1; digit <= 9; digit++) {
            // The old implementation put ~26% of codes on each of 1-3 and ~2.6% on each of 5-9.
            expect(counts.get(String(digit)) ?? 0).toBeGreaterThan(expected * 0.85);
            expect(counts.get(String(digit)) ?? 0).toBeLessThan(expected * 1.15);
        }
    });
});
