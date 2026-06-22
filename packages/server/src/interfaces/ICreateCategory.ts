export interface ICreateCategory {
    categoryName: string;
    currencyCode: string;
    iconId?: string;
    colorId?: string;
    budget?: number | null;
}
