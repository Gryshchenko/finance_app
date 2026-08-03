export interface IGroupSharedItem {
    id: number;
    type: 'account' | 'income' | 'category';
    name: string;
    isShared: boolean;
}
