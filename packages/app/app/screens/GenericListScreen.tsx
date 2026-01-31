import { ReactElement } from 'react';
import { TextStyle } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { ErrorState } from '@/components/ErrorState';
import { Header } from '@/components/Header';
import { PendingState } from '@/components/PengingState';
import { Screen } from '@/components/Screen';
import { $styles } from '@/theme/styles';

interface GenericListScreenProps<T, B> {
    name: string;
    isPending?: boolean;
    isError?: boolean;
    onBack?: () => void;
    onAdd?: () => void;
    props: {
        fetch?: B;
        data: T;
        onPress?: (id: number, name: string) => void;
    };
    RenderComponent: React.ComponentType<{ data: T; fetch?: B }>;
    RightActionComponent?: ReactElement;
}

export function GenericListScreen<T, B>({
    name,
    props,
    isPending,
    isError,
    onBack,
    RightActionComponent,
    RenderComponent,
}: GenericListScreenProps<T, B>) {
    return (
        <Screen preset="fixed" contentContainerStyle={[$styles.screen, $topAlignScreen]} safeAreaEdges={['top']}>
            <Header
                title={name}
                titleMode="flex"
                titleStyle={$rightAlignTitle}
                safeAreaEdges={[]}
                LeftActionComponent={onBack ? <BackButton onPress={onBack} /> : undefined}
                RightActionComponent={RightActionComponent ? RightActionComponent : undefined}
            />

            {isError && <ErrorState buttonOnPress={onBack} />}
            {isPending && <PendingState />}
            {!isError && !isPending && <RenderComponent {...props} />}
        </Screen>
    );
}

const $rightAlignTitle: TextStyle = {
    textAlign: 'center',
    textTransform: 'capitalize',
};

const $topAlignScreen: TextStyle = {
    justifyContent: 'flex-start',
};
