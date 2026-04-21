/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { ComponentProps } from 'react';
import { NavigationContainer, NavigatorScreenParams, ParamListBase } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';

import Config from '@/config';
import { useAuth } from '@/context/AuthContext';
import { OverviewNavigator, OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { ErrorBoundary } from '@/screens/ErrorScreen/ErrorBoundary';
import { ForgotPasswordChangeScreen } from '@/screens/ForgotPasswordChangeScreen';
import { ForgotPasswordConfirmScreen } from '@/screens/ForgotPasswordConfirmScreen';
import { ForgotPasswordRequestScreen } from '@/screens/ForgotPasswordRequestScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { SignUpConfirmationScreen } from '@/screens/SignUpConfirmationScreen';
import { SignUpScreen } from '@/screens/SignUpScreen';
import ToastService from '@/services/ToastService';
import { useAppTheme } from '@/theme/context';
import { AppPath } from '@/types/AppPath';

import { navigationRef, useBackButtonHandler } from './navigationUtilities';

/**
 * This type allows TypeScript to know what routes are defined in this navigator
 * as well as what properties (if any) they might take when navigating to them.
 *
 * For more information, see this documentation:
 *   https://reactnavigation.org/docs/params/
 *   https://reactnavigation.org/docs/typescript#type-checking-the-navigator
 *   https://reactnavigation.org/docs/typescript/#organizing-types
 */
export interface AppStackParamList extends ParamListBase {
    [AppPath.Login]: undefined;
    [AppPath.SignUp]: undefined;
    [AppPath.SignUpConfirmation]: undefined;
    [AppPath.ForgotPasswordRequest]: undefined;
    [AppPath.ForgotPasswordConfirm]: { email: string };
    [AppPath.ForgotPasswordChange]: undefined;
    [AppPath.Overview]: NavigatorScreenParams<OverviewTabParamList>;
}

type ScreenConfig = {
    name: keyof AppStackParamList;
    component: React.ComponentType<any>;
    initialParams?: Record<string, unknown>;
};

/**
 * This is a list of all the route names that will exit the app if the back button
 * is pressed while in that screen. Only affects Android.
 */
const exitRoutes = Config.exitRoutes;

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<AppStackParamList, T>;

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStack = () => {
    const { isAuthenticated, isUserConfirmed } = useAuth();

    const {
        theme: { colors },
    } = useAppTheme();

    const getInitialRoute = () => {
        if (!isAuthenticated) return AppPath.Login;
        return isUserConfirmed ? AppPath.Overview : AppPath.SignUpConfirmation;
    };

    const getScreens = (): ScreenConfig[] => {
        if (!isAuthenticated) {
            return [
                { name: AppPath.Login, component: LoginScreen },
                { name: AppPath.SignUp, component: SignUpScreen },
                { name: AppPath.ForgotPasswordChange, component: ForgotPasswordChangeScreen },
                { name: AppPath.ForgotPasswordRequest, component: ForgotPasswordRequestScreen },
                { name: AppPath.ForgotPasswordConfirm, component: ForgotPasswordConfirmScreen },
            ];
        }

        if (!isUserConfirmed) {
            return [{ name: AppPath.SignUpConfirmation, component: SignUpConfirmationScreen }];
        }

        return [{ name: AppPath.Overview, component: OverviewNavigator }];
    };

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                navigationBarColor: colors.background,
                contentStyle: { backgroundColor: colors.background },
            }}
            initialRouteName={getInitialRoute()}
        >
            {getScreens().map(({ name, component, initialParams }) => (
                <Stack.Screen key={name} name={name} component={component} initialParams={initialParams} />
            ))}
        </Stack.Navigator>
    );
};

export interface NavigationProps extends Partial<ComponentProps<typeof NavigationContainer<AppStackParamList>>> {}

export const AppNavigator = (props: NavigationProps) => {
    const { navigationTheme } = useAppTheme();

    useBackButtonHandler((routeName) => exitRoutes.includes(routeName));

    return (
        <NavigationContainer ref={navigationRef} theme={navigationTheme} {...props}>
            <ErrorBoundary catchErrors={Config.catchErrors}>
                <AppStack />
                {ToastService.setup()}
            </ErrorBoundary>
        </NavigationContainer>
    );
};
