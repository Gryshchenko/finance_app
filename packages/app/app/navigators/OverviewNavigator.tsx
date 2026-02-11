import { TextStyle, ViewStyle } from 'react-native';
import { BottomTabScreenProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams, ParamListBase } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { translate } from '@/i18n/translate';
import { AccountsPath, AccountsStackNavigator, AccountsStackParamList } from '@/navigators/AccountsStackNavigator';
import { CategoriesPath, CategoriesStackNavigator, CategoriesStackParamList } from '@/navigators/CategoriesStackNavigator';
import { DashboardPath, DashboardStackNavigator } from '@/navigators/DashboardStackNavigator';
import { HistoryStackNavigator, HistoryStackParamList } from '@/navigators/HistoryStackNavigator';
import { IncomePath, IncomesStackNavigator, IncomesStackParamList } from '@/navigators/IncomesStackNavigator';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';

import { AppStackParamList, AppStackScreenProps } from './AppNavigator';

export type OverviewTabParamList = {
    dashboard: NavigatorScreenParams<IncomesStackParamList> | {};
    incomes: NavigatorScreenParams<IncomesStackParamList> | {};
    balances: NavigatorScreenParams<AccountsStackParamList> | {};
    expenses: NavigatorScreenParams<CategoriesStackParamList> | {};
    history: NavigatorScreenParams<HistoryStackParamList> | {};
    settings: undefined;
    demo: undefined;
} & ParamListBase;

/**
 * Helper for automatically generating navigation prop types for each route.
 *
 * More info: https://reactnavigation.org/docs/typescript/#organizing-types
 */
export type MainTabScreenProps<T extends keyof OverviewTabParamList> = CompositeScreenProps<
    BottomTabScreenProps<OverviewTabParamList, T>,
    AppStackScreenProps<keyof AppStackParamList>
>;

const Tab = createBottomTabNavigator<OverviewTabParamList>();

/**
 * This is the main navigator for the demo screens with a bottom tab bar.
 * Each tab is a stack navigator with its own set of screens.
 *
 * More info: https://reactnavigation.org/docs/bottom-tab-navigator/
 * @returns {JSX.Element} The rendered `DemoNavigator`.
 */
export function OverviewNavigator() {
    const { bottom } = useSafeAreaInsets();
    const {
        themed,
        theme: { colors },
    } = useAppTheme();

    return (
        <CurrencyProvider>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarHideOnKeyboard: true,
                    tabBarStyle: themed([$tabBar, { height: bottom + 70 }]),
                    tabBarActiveTintColor: colors.text,
                    tabBarInactiveTintColor: colors.text,
                    tabBarLabelStyle: themed($tabBarLabel),
                    tabBarItemStyle: themed($tabBarItem),
                }}
            >
                <Tab.Screen
                    name="dashboard"
                    component={DashboardStackNavigator}
                    listeners={({ navigation }) => ({
                        tabPress: (event) => {
                            event.preventDefault();
                            navigation.navigate(OverviewPath.Dashboard, { screen: DashboardPath.Overview });
                        },
                    })}
                    options={{
                        tabBarIcon: ({ focused }) => (
                            <Icon icon="components" color={focused ? colors.tint : colors.tintInactive} size={30} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="incomes"
                    component={IncomesStackNavigator}
                    listeners={({ navigation }) => ({
                        tabPress: (event) => {
                            event.preventDefault();
                            navigation.navigate(OverviewPath.Incomes, { screen: IncomePath.Incomes });
                        },
                    })}
                    options={{
                        tabBarLabel: translate('common:incomes'),
                        tabBarIcon: ({ focused }) => (
                            <Icon icon="components" color={focused ? colors.tint : colors.tintInactive} size={30} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="balances"
                    component={AccountsStackNavigator}
                    listeners={({ navigation }) => ({
                        tabPress: (event) => {
                            event.preventDefault();
                            navigation.navigate(OverviewPath.Balances, { screen: AccountsPath.Accounts });
                        },
                    })}
                    options={{
                        tabBarLabel: translate('common:balance'),
                        tabBarIcon: ({ focused }) => (
                            <Icon icon="components" color={focused ? colors.tint : colors.tintInactive} size={30} />
                        ),
                    }}
                />

                <Tab.Screen
                    name="expenses"
                    component={CategoriesStackNavigator}
                    listeners={({ navigation }) => ({
                        tabPress: (event) => {
                            event.preventDefault();
                            navigation.navigate(OverviewPath.Expenses, { screen: CategoriesPath.Categories });
                        },
                    })}
                    options={{
                        tabBarLabel: translate('common:expenses'),
                        tabBarIcon: ({ focused }) => (
                            <Icon icon="community" color={focused ? colors.tint : colors.tintInactive} size={30} />
                        ),
                    }}
                />

                <Tab.Screen
                    name="history"
                    component={HistoryStackNavigator}
                    listeners={({ navigation }) => ({
                        tabPress: (event) => {
                            event.preventDefault();
                            navigation.navigate(OverviewPath.History, { screen: TransactionPath.Transactions });
                        },
                    })}
                    options={{
                        tabBarLabel: translate('common:history'),
                        tabBarIcon: ({ focused }) => (
                            <Icon icon="podcast" color={focused ? colors.tint : colors.tintInactive} size={30} />
                        ),
                    }}
                />

                <Tab.Screen
                    name="settings"
                    component={SettingsScreen}
                    options={{
                        tabBarLabel: translate('common:settings'),
                        tabBarIcon: ({ focused }) => (
                            <Icon icon="debug" color={focused ? colors.tint : colors.tintInactive} size={30} />
                        ),
                    }}
                />
            </Tab.Navigator>
        </CurrencyProvider>
    );
}

const $tabBar: ThemedStyle<ViewStyle> = ({ colors }) => ({
    backgroundColor: colors.background,
    borderTopColor: colors.transparent,
});

const $tabBarItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    paddingTop: spacing.md,
});

const $tabBarLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 12,
    fontFamily: typography.primary.medium,
    lineHeight: 16,
    color: colors.text,
});
