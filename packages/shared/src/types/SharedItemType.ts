/**
 * Kind of entity a group can share.
 *
 * The value selects which table a shared item id is resolved against, so it must be
 * one of the three the sharing tables know about - anything else would resolve to no
 * table at all.
 */
export enum SharedItemType {
    Account = 'account',
    Income = 'income',
    Category = 'category',
}

export const VALID_SHARED_ITEM_TYPES: string[] = Object.values(SharedItemType);
