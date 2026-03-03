import { IBoxDataItem } from '@/interfaces/IBoxDataItem';
import { BoxDataItemType } from '@/types/BoxDataItemType';

export const boxDataItemAdapter = <T>(items: T[]): IBoxDataItem<T>[] => {
    const newArray =
        items?.map((item: T | undefined) => {
            return {
                type: BoxDataItemType.Default,
                data: item,
            };
        }) ?? [];
    newArray.push({
        type: BoxDataItemType.New,
        data: undefined,
    });
    return newArray;
};
