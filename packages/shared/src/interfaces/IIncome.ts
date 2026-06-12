import { AccountStatusType } from 'types/AccountStatusType';

export interface IIncome {
    incomeId: number;
    userId: number;
    incomeName: string;
    currencyId: number;
    iconId: string;
    status: AccountStatusType;
    position: number;
    createdAt: Date;
    updatedAt: Date;
}
