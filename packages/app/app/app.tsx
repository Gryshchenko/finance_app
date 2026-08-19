/* eslint-disable import/first */
/**
 * Welcome to the main entry point of the app. In this file, we'll
 * be kicking off our app.
 *
 * Most of this file is boilerplate and you shouldn't need to modify
 * it very often. But take some time to look through and understand
 * what is going on here.
 *
 * The app navigation resides in ./app/navigators, so head over there
 * if you're interested in adding screens and navigators.
 */

import { useEffect, useState } from 'react';
// eslint-disable-next-line import/order
import { Platform } from 'react-native';

if (__DEV__ && Platform.OS !== 'web') {
    // Load Reactotron in development only.
    // Note that you must be using metro's `inlineRequires` for this to work.
    // If you turn it off in metro.config.js, you'll have to manually import it.
    // require('./devtools/ReactotronConfig.ts');
}

import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import * as Sentry from '@sentry/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/services/queryClient';
import { SecureBiometricStorage } from '@/services/SecureBiometricStorage';
import { initCrashReporting } from '@/utils/crashReporting';

import { AuthProvider } from './context/AuthContext';
import { initI18n } from './i18n';
import { AppNavigator } from './navigators/AppNavigator';
import { useNavigationPersistence } from './navigators/navigationUtilities';
import { ThemeProvider } from './theme/context';
import { customFontsToLoad } from './theme/typography';
import { loadDateFnsLocale } from './utils/formatDate';

// At module scope on purpose: an error thrown while the first render is still on its
// way up would be missed by an effect that has not run yet.
initCrashReporting();

export const NAVIGATION_PERSISTENCE_KEY = 'NAVIGATION_STATE';

// Web linking configuration
const prefix = Linking.createURL('/');
const config = {
    screens: {
        Login: {
            path: '',
        },
        SignUp: 'signup',
        SignUpConfirmation: 'signupconfirmation',
        Overview: 'overview',
    },
};

/**
 * This is the root component of our app.
 * @param {AppProps} props - The props for the `App` component.
 * @returns {JSX.Element} The rendered `App` component.
 */
function AppRoot() {
    const {
        initialNavigationState,
        onNavigationStateChange,
        isRestored: isNavigationStateRestored,
    } = useNavigationPersistence(SecureBiometricStorage, NAVIGATION_PERSISTENCE_KEY);

    const [areFontsLoaded, fontLoadError] = useFonts(customFontsToLoad);
    const [isI18nInitialized, setIsI18nInitialized] = useState(false);

    useEffect(() => {
        initI18n()
            .then(() => setIsI18nInitialized(true))
            .then(() => loadDateFnsLocale());
    }, []);

    // Before we show the app, we have to wait for our state to be ready.
    // In the meantime, don't render anything. This will be the background
    // color set in native by rootView's background color.
    // In iOS: application:didFinishLaunchingWithOptions:
    // In Android: https://stackoverflow.com/a/45838109/204044
    // You can replace with your own loading component if you wish.
    if (!isNavigationStateRestored || !isI18nInitialized || (!areFontsLoaded && !fontLoadError)) {
        return null;
    }

    const linking = {
        prefixes: [prefix],
        config,
    };

    // otherwise, we're ready to render the app
    return (
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <GestureHandlerRootView>
                <KeyboardProvider>
                    <AuthProvider>
                        <ThemeProvider>
                            <QueryClientProvider client={queryClient}>
                                <AppNavigator
                                    linking={linking}
                                    initialState={initialNavigationState}
                                    onStateChange={onNavigationStateChange}
                                />
                            </QueryClientProvider>
                        </ThemeProvider>
                    </AuthProvider>
                </KeyboardProvider>
            </GestureHandlerRootView>
        </SafeAreaProvider>
    );
}

/**
 * `Sentry.wrap` is what connects the native layer: it reports the crashes JS never
 * sees, tracks session health for the release health charts, and times the app start.
 * Uninitialised - no DSN, or a dev build - it hands the component straight back.
 */
export const App = Sentry.wrap(AppRoot);
