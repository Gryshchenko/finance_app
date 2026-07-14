import { useEffect, useRef } from 'react';
import { ViewStyle } from 'react-native';

import { IconTypes, PressableIcon } from '@/components/Icon';
import { useHeaderActions } from '@/context/HeaderActionsContext';
import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';

interface HeaderRightActionOptions {
    icon?: IconTypes;
    color?: string;
    disabled?: boolean;
}

export function useHeaderRightAction(handler: (() => void) | undefined, options?: HeaderRightActionOptions): void {
    const { setRightAction } = useHeaderActions();
    const { theme } = useAppTheme();

    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    const hasHandler = !!handler;
    const icon = options?.icon ?? 'trash';
    const color = options?.color ?? theme.colors.error;
    const disabled = options?.disabled ?? false;

    useEffect(() => {
        if (!hasHandler) {
            setRightAction(null);
            return;
        }
        setRightAction(
            <PressableIcon
                size={22}
                icon={icon}
                color={color}
                disabled={disabled}
                onPress={() => handlerRef.current?.()}
                containerStyle={$container}
            />,
        );
        return () => setRightAction(null);
    }, [hasHandler, icon, color, disabled, setRightAction]);
}

const $container: ViewStyle = {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
};
