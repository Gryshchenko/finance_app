import { TextStyle, ViewStyle } from 'react-native';
import { BottomTabScreenProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

import { CurrencyProvider } from '@/context/CurrencyContext';
import { AccountsStackNavigator, AccountsStackParamList } from '@/navigators/AccountsStackNavigator';
import { CategoriesStackNavigator, CategoriesStackParamList } from '@/navigators/CategoriesStackNavigator';
import { DashboardPath, DashboardStackNavigator, DashboardStackParamList } from '@/navigators/DashboardStackNavigator';
import { IncomesStackNavigator, IncomesStackParamList } from '@/navigators/IncomesStackNavigator';
import { SettingsPath, SettingsStackNavigator, SettingsStackParamList } from '@/navigators/SettingsStackNavigator';
import { TransactionStackNavigator, TransactionStackParamList } from '@/navigators/TransactionStackNavigator';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { OverviewPath } from '@/types/OverviewPath';

import { AppStackParamList, AppStackScreenProps } from './AppNavigator';
import { ResetOnBlur } from './ResetOnBlur';

export type OverviewTabParamList = {
    dashboard: NavigatorScreenParams<DashboardStackParamList>;
    incomes: NavigatorScreenParams<IncomesStackParamList>;
    accounts: NavigatorScreenParams<AccountsStackParamList>;
    categories: NavigatorScreenParams<CategoriesStackParamList>;
    transactions: NavigatorScreenParams<TransactionStackParamList>;
    settings: NavigatorScreenParams<SettingsStackParamList>;
};

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

const DashboardTab = () => <DashboardStackNavigator />;
const TransactionsTab = () => (
    <ResetOnBlur>
        <TransactionStackNavigator />
    </ResetOnBlur>
);
const AccountsTab = () => (
    <ResetOnBlur>
        <AccountsStackNavigator />
    </ResetOnBlur>
);
const CategoriesTab = () => (
    <ResetOnBlur>
        <CategoriesStackNavigator />
    </ResetOnBlur>
);
const IncomesTab = () => (
    <ResetOnBlur>
        <IncomesStackNavigator />
    </ResetOnBlur>
);
const SettingsTab = () => (
    <ResetOnBlur>
        <SettingsStackNavigator />
    </ResetOnBlur>
);

/**
 * This is the main navigator for the demo screens with a bottom tab bar.
 * Each tab is a stack navigator with its own set of screens.
 *
 * More info: https://reactnavigation.org/docs/bottom-tab-navigator/
 * @returns {JSX.Element} The rendered `DemoNavigator`.
 */
export function OverviewNavigator() {
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
                    tabBarStyle: { display: 'none' },
                    tabBarActiveTintColor: colors.text,
                    tabBarInactiveTintColor: colors.textDim,
                    tabBarLabelStyle: themed($tabBarLabel),
                    tabBarItemStyle: themed($tabBarItem),
                    tabBarShowLabel: false,
                }}
            >
                <Tab.Screen
                    name="dashboard"
                    component={DashboardTab}
                    key={Date.now()}
                    listeners={({ navigation }) => ({
                        tabPress: (event) => {
                            event.preventDefault();
                            navigation.navigate(OverviewPath.Dashboard, { screen: DashboardPath.Overview });
                        },
                    })}
                />

                <Tab.Screen
                    name="transactions"
                    component={TransactionsTab}
                    key={Date.now()}
                    listeners={({ navigation }) => ({
                        tabPress: (event) => {
                            event.preventDefault();
                            navigation.navigate(OverviewPath.Dashboard, { screen: DashboardPath.Overview });
                        },
                    })}
                />

                <Tab.Screen
                    name="accounts"
                    component={AccountsTab}
                    key={Date.now()}
                    listeners={({ navigation }) => ({
                        tabPress: (event) => {
                            event.preventDefault();
                            navigation.navigate(OverviewPath.Dashboard, { screen: DashboardPath.Overview });
                        },
                    })}
                />
                <Tab.Screen
                    name="categories"
                    component={CategoriesTab}
                    key={Date.now()}
                    listeners={({ navigation }) => ({
                        tabPress: (event) => {
                            event.preventDefault();
                            navigation.navigate(OverviewPath.Dashboard, { screen: DashboardPath.Overview });
                        },
                    })}
                />
                <Tab.Screen
                    name="incomes"
                    component={IncomesTab}
                    key={Date.now()}
                    listeners={({ navigation }) => ({
                        tabPress: (event) => {
                            event.preventDefault();
                            navigation.navigate(OverviewPath.Dashboard, { screen: DashboardPath.Overview });
                        },
                    })}
                />
                <Tab.Screen
                    name="settings"
                    component={SettingsTab}
                    listeners={({ navigation }) => ({
                        tabPress: (event) => {
                            event.preventDefault();
                            navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.Settings });
                        },
                    })}
                />
            </Tab.Navigator>
        </CurrencyProvider>
    );
}

const $tabBarItem: ThemedStyle<ViewStyle> = () => ({
    paddingTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
});

const $tabBarLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 12,
    fontFamily: typography.primary.medium,
    lineHeight: 16,
    color: colors.text,
});
