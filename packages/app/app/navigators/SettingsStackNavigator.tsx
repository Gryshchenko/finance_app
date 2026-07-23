import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IAvatarConfig } from '@tenpercent/shared';

import { OnboardingTutorialScreen } from '@/screens/OnboardingTutorialScreen/OnboardingTutorialScreen';
import { SettingsChangeAvatarScreen } from '@/screens/SettingsScreens/SettingsChangeAvatarScreen';
import { SettingsChangeEmailConfirmScreen } from '@/screens/SettingsScreens/SettingsChangeEmailConfirmScreen';
import { SettingsChangeEmailScreen } from '@/screens/SettingsScreens/SettingsChangeEmailScreen';
import { SettingsChangePasswordConfirmScreen } from '@/screens/SettingsScreens/SettingsChangePasswordConfirmScreen';
import { SettingsChangePasswordScreen } from '@/screens/SettingsScreens/SettingsChangePasswordScreen';
import { SettingsChangePublicNameScreen } from '@/screens/SettingsScreens/SettingsChangePublicNameScreen';
import { SettingsScreen } from '@/screens/SettingsScreens/SettingsScreen';
import { ConnectedUsersScreen } from '@/screens/SharingScreens/ConnectedUsersScreen';
import { CreateGroupScreen } from '@/screens/SharingScreens/CreateGroupScreen';
import { EditGroupScreen } from '@/screens/SharingScreens/EditGroupScreen';
import { GroupsScreen } from '@/screens/SharingScreens/GroupsScreen';
import { InviteUserScreen } from '@/screens/SharingScreens/InviteUserScreen';
import { MemberSettingsScreen } from '@/screens/SharingScreens/MemberSettingsScreen';
import { PendingRequestsScreen } from '@/screens/SharingScreens/PendingRequestsScreen';
import { SignUpGoalsScreen } from '@/screens/SignUpGoalsScreen';

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

export enum SettingsPath {
    Settings = 'settingsHome',
    ChangePublicName = 'changePublicName',
    ChangeAvatar = 'changeAvatar',
    ChangePassword = 'changePassword',
    ChangePasswordConfirm = 'changePasswordConfirm',
    ChangeEmail = 'changeEmail',
    ChangeEmailConfirm = 'changeEmailConfirm',
    ConnectedUsers = 'connectedUsers',
    InviteUser = 'inviteUser',
    MemberSettings = 'memberSettings',
    PendingRequests = 'pendingRequests',
    Groups = 'groups',
    CreateGroup = 'createGroup',
    EditGroup = 'editGroup',
    Tutorial = 'tutorial',
    Goals = 'goalsSurvey',
}

export type SettingsStackParamList = {
    settingsHome: undefined;
    changePublicName: { publicName: string | undefined };
    changeAvatar: { avatar: IAvatarConfig | undefined; seed: string };
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
    connectedUsers: undefined;
    inviteUser: undefined;
    memberSettings: { connectionId: number };
    pendingRequests: undefined;
    groups: undefined;
    createGroup: undefined;
    editGroup: { userGroupId: number };
    tutorial: undefined;
    goalsSurvey: undefined;
};

// Replay of the onboarding tour from Settings — nothing is reported to the server here.
function SettingsTutorialScreen() {
    const navigation = useNavigation();
    return <OnboardingTutorialScreen onDone={() => navigation.goBack()} />;
}

// Lets the user revise the goals they picked during sign-up.
function SettingsGoalsScreen() {
    const navigation = useNavigation();
    return <SignUpGoalsScreen onDone={() => navigation.goBack()} onBack={() => navigation.goBack()} />;
}

function SettingsStackNavigator() {
    return (
        <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
            <SettingsStack.Screen name={SettingsPath.Settings} component={SettingsScreen} />
            <SettingsStack.Screen name={SettingsPath.ChangePublicName} component={SettingsChangePublicNameScreen} />
            <SettingsStack.Screen name={SettingsPath.ChangeAvatar} component={SettingsChangeAvatarScreen} />
            <SettingsStack.Screen name={SettingsPath.ChangeEmail} component={SettingsChangeEmailScreen} />
            <SettingsStack.Screen name={SettingsPath.ChangeEmailConfirm} component={SettingsChangeEmailConfirmScreen} />
            <SettingsStack.Screen name={SettingsPath.ChangePassword} component={SettingsChangePasswordScreen} />
            <SettingsStack.Screen name={SettingsPath.ChangePasswordConfirm} component={SettingsChangePasswordConfirmScreen} />
            <SettingsStack.Screen name={SettingsPath.ConnectedUsers} component={ConnectedUsersScreen} />
            <SettingsStack.Screen name={SettingsPath.InviteUser} component={InviteUserScreen} />
            <SettingsStack.Screen name={SettingsPath.MemberSettings} component={MemberSettingsScreen} />
            <SettingsStack.Screen name={SettingsPath.PendingRequests} component={PendingRequestsScreen} />
            <SettingsStack.Screen name={SettingsPath.Groups} component={GroupsScreen} />
            <SettingsStack.Screen name={SettingsPath.CreateGroup} component={CreateGroupScreen} />
            <SettingsStack.Screen name={SettingsPath.EditGroup} component={EditGroupScreen} />
            <SettingsStack.Screen name={SettingsPath.Tutorial} component={SettingsTutorialScreen} />
            <SettingsStack.Screen name={SettingsPath.Goals} component={SettingsGoalsScreen} />
        </SettingsStack.Navigator>
    );
}
export { SettingsStackNavigator };
