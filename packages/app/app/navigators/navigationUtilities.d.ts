import { NavigationState, PartialState } from '@react-navigation/native';

import * as storage from '@/utils/storage';

import type { AppStackParamList } from './AppNavigator';

type Storage = typeof storage;
/**
 * Reference to the root App Navigator.
 *
 * If needed, you can use this to access the navigation object outside of a
 * `NavigationContainer` context. However, it's recommended to use the `useNavigation` hook whenever possible.
 * @see [Navigating Without Navigation Prop]{@link https://reactnavigation.org/docs/navigating-without-navigation-prop/}
 *
 * The types on this reference will only let you reference top level navigators. If you have
 * nested navigators, you'll need to use the `useNavigation` with the stack navigator's ParamList type.
 */
export declare const navigationRef: import('@react-navigation/native').NavigationContainerRefWithCurrent<AppStackParamList>;
/**
 * Gets the current screen from any navigation state.
 * @param {NavigationState | PartialState<NavigationState>} state - The navigation state to traverse.
 * @returns {string} - The name of the current screen.
 */
export declare function getActiveRouteName(state: NavigationState | PartialState<NavigationState>): string;
/**
 * Hook that handles Android back button presses and forwards those on to
 * the navigation or allows exiting the app.
 * @see [BackHandler]{@link https://reactnative.dev/docs/backhandler}
 * @param {(routeName: string) => boolean} canExit - Function that returns whether we can exit the app.
 * @returns {void}
 */
export declare function useBackButtonHandler(canExit: (routeName: string) => boolean): void;
/**
 * Custom hook for persisting navigation state.
 * @param {Storage} storage - The storage utility to use.
 * @param {string} persistenceKey - The key to use for storing the navigation state.
 * @returns {object} - The navigation state and persistence functions.
 */
export declare function useNavigationPersistence(
    storage: Storage,
    persistenceKey: string,
): {
    onNavigationStateChange: (state: NavigationState | undefined) => void;
    restoreState: () => Promise<void>;
    isRestored: boolean;
    initialNavigationState:
        | Readonly<
              Partial<
                  Omit<
                      Readonly<{
                          key: string;
                          index: number;
                          routeNames: string[];
                          history?: unknown[];
                          routes: import('@react-navigation/native').NavigationRoute<
                              import('@react-navigation/native').ParamListBase,
                              string
                          >[];
                          type: string;
                          stale: false;
                      }>,
                      'stale' | 'routes'
                  >
              > & {
                  routes: (Omit<import('@react-navigation/native').Route<string>, 'key'> & {
                      state?: import('@react-navigation/native').InitialState;
                  })[];
              }
          >
        | undefined;
};
/**
 * use this to navigate without the navigation
 * prop. If you have access to the navigation prop, do not use this.
 * @see {@link https://reactnavigation.org/docs/navigating-without-navigation-prop/}
 * @param {unknown} name - The name of the route to navigate to.
 * @param {unknown} params - The params to pass to the route.
 */
export declare function navigate(name: unknown, params?: unknown): void;
/**
 * This function is used to go back in a navigation stack, if it's possible to go back.
 * If the navigation stack can't go back, nothing happens.
 * The navigationRef variable is a React ref that references a navigation object.
 * The navigationRef variable is set in the App component.
 */
export declare function goBack(): void;
/**
 * resetRoot will reset the root navigation state to the given params.
 * @param {Parameters<typeof navigationRef.resetRoot>[0]} state - The state to reset the root to.
 * @returns {void}
 */
export declare function resetRoot(state?: Parameters<typeof navigationRef.resetRoot>[0]): void;
export {};
