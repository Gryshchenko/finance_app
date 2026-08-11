import ToastService from '@/services/ToastService';

export const ensureOwner = (isOwner: boolean | undefined): boolean => {
    if (isOwner === false) {
        ToastService.error({ title: 'common:error', message: 'common:notOwnerModify' });
        return false;
    }
    return true;
};
