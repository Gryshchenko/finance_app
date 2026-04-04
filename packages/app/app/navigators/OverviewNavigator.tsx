import { TextStyle, ViewStyle } from 'react-native';
import { BottomTabScreenProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams, ParamListBase } from '@react-navigation/native';

import { CurrencyProvider } from '@/context/CurrencyContext';
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
    dashboard: NavigatorScreenParams<IncomesStackParamList> | undefined;
    incomes: NavigatorScreenParams<IncomesStackParamList> | undefined;
    balances: NavigatorScreenParams<AccountsStackParamList> | undefined;
    categories: NavigatorScreenParams<CategoriesStackParamList> | undefined;
    transactions: NavigatorScreenParams<HistoryStackParamList> | undefined;
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

// /**
//  * Center "Add" tab button — black square with white "+" icon, matching code.html design.
//  */
// function AddTabButton({ onPress }: { onPress?: () => void }) {
//     const { themed } = useAppTheme();
//
//     return (
//         <Pressable onPress={onPress} style={themed([$addButton])}>
//             <Icon icon="add" size={24} color="#ffffff" />
//         </Pressable>
//     );
// }

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
                    component={DashboardStackNavigator}
                    listeners={({ navigation }) => ({
                        tabPress: (event) => {
                            event.preventDefault();
                            navigation.navigate(OverviewPath.Dashboard, { screen: DashboardPath.Overview });
                        },
                    })}
                />

                <Tab.Screen
                    name="transactions"
                    component={HistoryStackNavigator}
                    listeners={({ navigation }) => ({
                        tabPress: (event) => {
                            event.preventDefault();
                            navigation.navigate(OverviewPath.Transactions, { screen: TransactionPath.Transactions });
                        },
                    })}
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
                />
                <Tab.Screen
                    name="categories"
                    component={CategoriesStackNavigator}
                    listeners={({ navigation }) => ({
                        tabPress: (event) => {
                            event.preventDefault();
                            navigation.navigate(OverviewPath.Categories, { screen: CategoriesPath.Categories });
                        },
                    })}
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
                />
                <Tab.Screen name="settings" component={SettingsScreen} />
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
