export interface ISummary {
    data: Array<{
        income_total: number;
        expense_total: number;
        transfer_total: number;
        currencyCode: string;
        date: string;
    }>;
    from: string;
    to: string;
}
