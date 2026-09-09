import { ReactElement, useMemo, useState } from 'react';
import { TextStyle } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { ErrorState } from '@/components/ErrorState';
import { Header } from '@/components/Header';
import { PendingState } from '@/components/PengingState';
import { Screen } from '@/components/Screen';
import { HeaderActionsContext } from '@/context/HeaderActionsContext';
import { $styles } from '@/theme/styles';

interface GenericListScreenProps<T, B> {
    name: string;
    subtitle?: string;
    isPending?: boolean;
    isError?: boolean;
    onBack?: () => void;
    onAdd?: () => void;
    props: {
        fetch?: B;
        data: T;
        onPress?: (id: number, name: string) => void;
        [key: string]: unknown;
    };
    RenderComponent: React.ComponentType<{ data: T; fetch?: B; [key: string]: unknown }>;
    RightActionComponent?: ReactElement;
}

export function GenericListScreen<T, B>({
    name,
    subtitle,
    props,
    isPending,
    isError,
    onBack,
    RightActionComponent,
    RenderComponent,
}: GenericListScreenProps<T, B>) {
    // Lets the rendered content register a header right action (e.g. a delete
    // button) even though the header lives here, above the content.
    const [contentRightAction, setContentRightAction] = useState<ReactElement | null>(null);
    const headerActions = useMemo(() => ({ setRightAction: setContentRightAction }), []);

    return (
        <Screen preset="fixed" contentContainerStyle={[$styles.screen, $topAlignScreen]} safeAreaEdges={['bottom']}>
            <Header
                title={name}
                subtitle={subtitle}
                titleMode="flex"
                titleStyle={$rightAlignTitle}
                LeftActionComponent={onBack ? <BackButton onPress={onBack} /> : undefined}
                RightActionComponent={RightActionComponent ?? contentRightAction ?? undefined}
            />

            <HeaderActionsContext.Provider value={headerActions}>
                {isError && <ErrorState buttonOnPress={onBack} />}
                {isPending && <PendingState />}
                {!isError && !isPending && <RenderComponent {...props} />}
            </HeaderActionsContext.Provider>
        </Screen>
    );
}

const $rightAlignTitle: TextStyle = {
    textAlign: 'center',
    textTransform: 'uppercase',
};

const $topAlignScreen: TextStyle = {
    justifyContent: 'flex-start',
};
