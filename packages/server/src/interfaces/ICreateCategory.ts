export interface ICreateCategory {
    categoryName: string;
    currencyId: number;
    iconId?: string;
    colorId?: string;
    budget?: number | null;
}
