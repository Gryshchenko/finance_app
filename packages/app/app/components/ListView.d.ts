import { PropsWithoutRef, ReactElement, RefObject } from 'react';
import { FlatList } from 'react-native';
import { FlashList, FlashListProps } from '@shopify/flash-list';

export type ListViewRef<T> = FlashList<T> | FlatList<T>;
export type ListViewProps<T> = PropsWithoutRef<FlashListProps<T>>;
export declare const ListView: <T>(
    props: ListViewProps<T> & {
        ref?: RefObject<ListViewRef<T> | null>;
    },
) => ReactElement;
