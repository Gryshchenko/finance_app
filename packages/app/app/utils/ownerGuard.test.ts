import ToastService from '@/services/ToastService';
import { ensureOwner } from '@/utils/ownerGuard';

jest.mock('@/services/ToastService', () => ({
    __esModule: true,
    default: { error: jest.fn() },
}));

const toastError = ToastService.error as jest.Mock;

describe('ensureOwner', () => {
    beforeEach(() => {
        toastError.mockClear();
    });

    it('blocks the write and surfaces a toast when the user is not the owner', () => {
        expect(ensureOwner(false)).toBe(false);
        expect(toastError).toHaveBeenCalledWith({ title: 'common:error', message: 'common:notOwnerModify' });
    });

    it('lets the owner through without a toast', () => {
        expect(ensureOwner(true)).toBe(true);
        expect(toastError).not.toHaveBeenCalled();
    });

    it('lets an unknown ownership through - the server stays the source of truth', () => {
        expect(ensureOwner(undefined)).toBe(true);
        expect(toastError).not.toHaveBeenCalled();
    });
});
