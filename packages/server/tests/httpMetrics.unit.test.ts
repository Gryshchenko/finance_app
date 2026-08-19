import { normalizeRoute } from 'middleware/httpMetrics';

describe('normalizeRoute', () => {
    it('keeps a static route as it is', () => {
        expect(normalizeRoute('/auth/login')).toBe('/auth/login');
    });

    it('maps the root to a single label', () => {
        expect(normalizeRoute('/')).toBe('/');
    });

    it('collapses a numeric id, so one series covers every account', () => {
        expect(normalizeRoute('/user/42/accounts')).toBe('/user/:id/accounts');
    });

    it('collapses a uuid', () => {
        expect(normalizeRoute('/user/6f1c0b6e-2a4e-4d1a-9a1e-2f7f4b6d8c31')).toBe('/user/:uuid');
    });

    it('collapses an address, which would otherwise mint a series per user', () => {
        expect(normalizeRoute('/register/confirm/someone@example.com')).toBe('/register/confirm/:email');
    });

    it('collapses a long opaque segment, which is a token or a code', () => {
        expect(normalizeRoute(`/auth/reset/${'a'.repeat(64)}`)).toBe('/auth/reset/:token');
    });

    it('reports an unmounted prefix as unmatched, so scanners cannot grow the label set', () => {
        expect(normalizeRoute('/wp-admin/setup-config.php')).toBe('unmatched');
        expect(normalizeRoute('/.env')).toBe('unmatched');
        expect(normalizeRoute('/api/v1/users')).toBe('unmatched');
    });

    it('truncates a deep path rather than following it', () => {
        expect(normalizeRoute('/user/1/a/b/c/d/e/f/g')).toBe('/user/:id/a/b/c/d/*');
    });

    it('treats a trailing slash as the same route', () => {
        expect(normalizeRoute('/auth/login/')).toBe('/auth/login');
    });
});
