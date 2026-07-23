/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { ComponentProps } from 'react';
import { ActivityIndicator, View, ViewStyle } from 'react-native';
import { NavigationContainer, NavigatorScreenParams, ParamListBase } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';

import Config from '@/config';
import { useAuth } from '@/context/AuthContext';
import { useTutorials } from '@/hooks/useTutorials';
import { OverviewNavigator, OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { ErrorBoundary } from '@/screens/ErrorScreen/ErrorBoundary';
import { ForgotPasswordChangeScreen } from '@/screens/ForgotPasswordChangeScreen';
import { ForgotPasswordConfirmScreen } from '@/screens/ForgotPasswordConfirmScreen';
import { ForgotPasswordRequestScreen } from '@/screens/ForgotPasswordRequestScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { OnboardingTutorialScreen } from '@/screens/OnboardingTutorialScreen/OnboardingTutorialScreen';
import { SignUpConfirmationScreen } from '@/screens/SignUpConfirmationScreen';
import { SignUpGoalsScreen } from '@/screens/SignUpGoalsScreen';
import { SignUpScreen } from '@/screens/SignUpScreen';
import ToastService from '@/services/ToastService';
import { useAppTheme } from '@/theme/context';
import { AppPath } from '@/types/AppPath';

import { navigationRef, useBackButtonHandler } from './navigationUtilities';
import { ResetOnBlur } from './ResetOnBlur';

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
    [AppPath.SignUpGoals]: undefined;
    [AppPath.OnboardingTutorial]: undefined;
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

const LoginScreenTab = (props: AppStackScreenProps<AppPath.Login>) => (
    <ResetOnBlur>
        <LoginScreen {...props} />
    </ResetOnBlur>
);
const ForgotPasswordChangeScreenTab = (props: AppStackScreenProps<AppPath.ForgotPasswordChange>) => (
    <ResetOnBlur>
        <ForgotPasswordChangeScreen {...props} />
    </ResetOnBlur>
);
const ForgotPasswordRequestScreenTab = (props: AppStackScreenProps<AppPath.ForgotPasswordRequest>) => (
    <ResetOnBlur>
        <ForgotPasswordRequestScreen {...props} />
    </ResetOnBlur>
);
const ForgotPasswordConfirmScreenTab = (props: AppStackScreenProps<AppPath.ForgotPasswordConfirm>) => (
    <ResetOnBlur>
        <ForgotPasswordConfirmScreen {...props} />
    </ResetOnBlur>
);
const SignUpConfirmationScreenTab = (props: AppStackScreenProps<AppPath.SignUpConfirmation>) => (
    <ResetOnBlur>
        <SignUpConfirmationScreen {...props} />
    </ResetOnBlur>
);
const SignUpScreenTab = (props: AppStackScreenProps<AppPath.SignUp>) => (
    <ResetOnBlur>
        <SignUpScreen {...props} />
    </ResetOnBlur>
);
const SignUpGoalsScreenTab = (props: AppStackScreenProps<AppPath.SignUpGoals>) => (
    <ResetOnBlur>
        <SignUpGoalsScreen onDone={() => props.navigation.navigate(AppPath.OnboardingTutorial)} />
    </ResetOnBlur>
);
// Once the tutorial finishes, markSeen flips the cached tutorials flag and the
// stack below swaps to Overview on its own — no navigation call needed here.
const OnboardingTutorialScreenTab = () => (
    <ResetOnBlur>
        <OnboardingTutorialScreen reportView onDone={() => undefined} />
    </ResetOnBlur>
);
const OverviewNavigatorTab = () => (
    <ResetOnBlur>
        <OverviewNavigator />
    </ResetOnBlur>
);
const OnboardingGate = () => {
    const {
        theme: { colors },
    } = useAppTheme();
    return (
        <View style={[$gate, { backgroundColor: colors.background }]}>
            <ActivityIndicator color={colors.tint} />
        </View>
    );
};
const $gate: ViewStyle = { flex: 1, alignItems: 'center', justifyContent: 'center' };

const AppStack = () => {
    const { isAuthenticated, isUserConfirmed } = useAuth();
    const {
        tutorials,
        isPending: isTutorialsPending,
        isError: isTutorialsError,
    } = useTutorials({ enabled: isAuthenticated && isUserConfirmed });

    const {
        theme: { colors },
    } = useAppTheme();

    const needsOnboarding = !isTutorialsPending && !isTutorialsError && !tutorials?.isOnBoardingTutorialView;

    const getInitialRoute = () => {
        if (!isAuthenticated) return AppPath.Login;
        if (!isUserConfirmed) return AppPath.SignUpConfirmation;
        if (needsOnboarding) return AppPath.SignUpGoals;
        return AppPath.Overview;
    };

    const getScreens = (): ScreenConfig[] => {
        if (!isAuthenticated) {
            return [
                { name: AppPath.Login, component: LoginScreenTab },
                { name: AppPath.SignUp, component: SignUpScreenTab },
                { name: AppPath.ForgotPasswordChange, component: ForgotPasswordChangeScreenTab },
                { name: AppPath.ForgotPasswordRequest, component: ForgotPasswordRequestScreenTab },
                { name: AppPath.ForgotPasswordConfirm, component: ForgotPasswordConfirmScreenTab },
            ];
        }

        if (!isUserConfirmed) {
            return [{ name: AppPath.SignUpConfirmation, component: SignUpConfirmationScreenTab }];
        }

        if (isTutorialsPending) {
            return [{ name: AppPath.Overview, component: OnboardingGate }];
        }

        if (needsOnboarding) {
            return [
                { name: AppPath.SignUpGoals, component: SignUpGoalsScreenTab },
                { name: AppPath.OnboardingTutorial, component: OnboardingTutorialScreenTab },
            ];
        }

        return [{ name: AppPath.Overview, component: OverviewNavigatorTab }];
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
