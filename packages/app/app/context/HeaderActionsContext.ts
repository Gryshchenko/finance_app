import { createContext, ReactElement, useContext } from 'react';

export interface HeaderActionsContextValue {
    setRightAction: (node: ReactElement | null) => void;
}

export const HeaderActionsContext = createContext<HeaderActionsContextValue>({
    setRightAction: () => {},
});

export const useHeaderActions = (): HeaderActionsContextValue => useContext(HeaderActionsContext);
