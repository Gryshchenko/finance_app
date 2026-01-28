/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { ComponentProps } from "react"
import { NavigationContainer, NavigatorScreenParams, ParamListBase } from "@react-navigation/native"
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack"

import Config from "@/config"
import { useAuth } from "@/context/AuthContext"
import { OverviewNavigator, OverviewTabParamList } from "@/navigators/OverviewNavigator"
import { ErrorBoundary } from "@/screens/ErrorScreen/ErrorBoundary"
import { LoginScreen } from "@/screens/LoginScreen"
import { SignUpConfirmationScreen } from "@/screens/SignUpConfirmationScreen"
import { SignUpScreen } from "@/screens/SignUpScreen"
import { WelcomeScreen } from "@/screens/WelcomeScreen"
import { useAppTheme } from "@/theme/context"

import { navigationRef, useBackButtonHandler } from "./navigationUtilities"

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
  welcome: undefined
  login: undefined
  signUp: undefined
  signUpConfirmation: undefined
  overview: NavigatorScreenParams<OverviewTabParamList>
}

type ScreenConfig = {
  name: keyof AppStackParamList
  component: React.ComponentType<any>
  initialParams?: Record<string, unknown>
}

/**
 * This is a list of all the route names that will exit the app if the back button
 * is pressed while in that screen. Only affects Android.
 */
const exitRoutes = Config.exitRoutes

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = () => {
  const { isAuthenticated, isUserConfirmed } = useAuth()

  const {
    theme: { colors },
  } = useAppTheme()

  const getInitialRoute = () => {
    if (!isAuthenticated) return "login"
    return isUserConfirmed ? "overview" : "signUpConfirmation"
  }

  const getScreens = (): ScreenConfig[] => {
    if (!isAuthenticated) {
      return [
        { name: "login", component: LoginScreen },
        { name: "signUp", component: SignUpScreen },
      ]
    }

    if (!isUserConfirmed) {
      return [{ name: "signUpConfirmation", component: SignUpConfirmationScreen }]
    }

    return [
      { name: "welcome", component: WelcomeScreen },
      { name: "overview", component: OverviewNavigator },
    ]
  }

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
  )
}

export interface NavigationProps
  extends Partial<ComponentProps<typeof NavigationContainer<AppStackParamList>>> {}

export const AppNavigator = (props: NavigationProps) => {
  const { navigationTheme } = useAppTheme()

  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} {...props}>
      <ErrorBoundary catchErrors={Config.catchErrors}>
        <AppStack />
      </ErrorBoundary>
    </NavigationContainer>
  )
}
