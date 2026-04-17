import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SettingsChangeEmailConfirmScreen } from '@/screens/SettingsScreens/SettingsChangeEmailConfirmScreen';
import { SettingsChangeEmailScreen } from '@/screens/SettingsScreens/SettingsChangeEmailScreen';
import { SettingsChangePasswordConfirmScreen } from '@/screens/SettingsScreens/SettingsChangePasswordConfirmScreen';
import { SettingsChangePasswordScreen } from '@/screens/SettingsScreens/SettingsChangePasswordScreen';
import { SettingsChangePublicNameScreen } from '@/screens/SettingsScreens/SettingsChangePublicNameScreen';
import { SettingsScreen } from '@/screens/SettingsScreens/SettingsScreen';

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

export enum SettingsPath {
    Settings = 'settingsHome',
    ChangePublicName = 'changePublicName',
    ChangePassword = 'changePassword',
    ChangePasswordConfirm = 'changePasswordConfirm',
    ChangeEmail = 'changeEmail',
    ChangeEmailConfirm = 'changeEmailConfirm',
}

export type SettingsStackParamList = {
    settingsHome: undefined;
    changePublicName: { publicName: string | undefined };
    changePassword: undefined;
    changePasswordConfirm: undefined;
    changeEmail: {
        email: string;
        originEmail: string;
    };
    changeEmailConfirm: {
        email: string;
        originEmail: string;
    };
};

function SettingsStackNavigator() {
    return (
        <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
            <SettingsStack.Screen name={SettingsPath.Settings} component={SettingsScreen} />
            <SettingsStack.Screen name={SettingsPath.ChangePublicName} component={SettingsChangePublicNameScreen} />
            <SettingsStack.Screen name={SettingsPath.ChangeEmail} component={SettingsChangeEmailScreen} />
            <SettingsStack.Screen name={SettingsPath.ChangeEmailConfirm} component={SettingsChangeEmailConfirmScreen} />
            <SettingsStack.Screen name={SettingsPath.ChangePassword} component={SettingsChangePasswordScreen} />
            <SettingsStack.Screen name={SettingsPath.ChangePasswordConfirm} component={SettingsChangePasswordConfirmScreen} />
        </SettingsStack.Navigator>
    );
}
export { SettingsStackNavigator };
