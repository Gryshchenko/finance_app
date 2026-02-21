import { BoxDataItemType } from '@/types/BoxDataItemType';

export interface IBoxDataItem<T> {
    type: BoxDataItemType;
    data?: T;
}
