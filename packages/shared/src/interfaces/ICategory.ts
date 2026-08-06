import { AccountStatusType } from 'types/AccountStatusType';

export interface ICategory {
    categoryName: string;
    categoryId: number;
    currencyCode: string;
    iconId: string;
    colorId?: string | null;
    status: AccountStatusType;
    budget?: number | null;
    position: number;
    createdAt: Date;
    updatedAt: Date;
    isOwner: boolean;
}
