import { AccountStatusType } from 'types/AccountStatusType';

export interface IIncome {
    incomeId: number;
    userId: number;
    incomeName: string;
    currencyCode: string;
    iconId: string;
    colorId?: string | null;
    status: AccountStatusType;
    position: number;
    createdAt: Date;
    updatedAt: Date;
}
