import { AccountStatusType } from 'types/AccountStatusType';

export interface ICategory {
    categoryName: string;
    categoryId: number;
    userId: number;
    currencyId: number;
    iconId: string;
    status: AccountStatusType;
    createdAt: Date;
    updatedAt: Date;
}
