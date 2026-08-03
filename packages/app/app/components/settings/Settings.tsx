import { FC } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View, ViewStyle } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';

import { SettingsLogoutButton } from '@/components/settings/SettingsLogoutButton';
import { SettingsPreferencesSection } from '@/components/settings/SettingsPreferencesSection';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { useSettingsProfile } from '@/hooks/useSettingsProfile';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath } from '@/navigators/SettingsStackNavigator';
import { $styles } from '@/theme/styles';
import { OverviewPath } from '@/types/OverviewPath';
import { openLinkInBrowser } from '@/utils/openLinkInBrowser';

const APP_VERSION = 'v1.0.0';

// Placeholder URLs - replace with real endpoints before release
const PRIVACY_POLICY_URL = '';
const TERMS_OF_SERVICE_URL = '';

interface SettingsProps {
    onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    // Top/bottom padding so the list clears the absolute blur header / footer.
    contentPaddingTop?: number;
    contentPaddingBottom?: number;
}

export const Settings: FC<SettingsProps> = function Settings({ onScroll, contentPaddingTop, contentPaddingBottom }) {
    const {
        profile,
        currencyList,
        currencyValue,
        currencyDisplayValue,
        languageOptions,
        languageValue,
        languageDisplayValue,
        isSaving,
        handleCurrencyChange,
        handleLanguageChange,
    } = useSettingsProfile();

    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    return (
        <ScrollView
            style={$styles.flex1}
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingTop: contentPaddingTop, paddingBottom: contentPaddingBottom }}
        >
            <View style={$sections}>
                <SettingsSection titleTx="settingsScreen:account">
                    <SettingsRow
                        labelTx="settingsScreen:emailAddress"
                        value={profile?.email}
                        icon="chevron-right"
                        onPress={() => {
                            navigation.navigate(OverviewPath.Settings, {
                                screen: SettingsPath.ChangeEmail,
                                params: {
                                    email: profile?.email ?? '-',
                                    originEmail: profile?.email ?? '-',
                                },
                            });
                        }}
                    />
                    <SettingsRow
                        labelTx="settingsScreen:password"
                        value="••••••••"
                        icon="edit"
                        onPress={() => {
                            navigation.navigate(OverviewPath.Settings, {
                                screen: SettingsPath.ChangePassword,
                            });
                        }}
                    />
                    <SettingsRow
                        labelTx="settingsScreen:publicName"
                        value={profile?.publicName ?? '-'}
                        icon="edit"
                        onPress={() => {
                            navigation.navigate(OverviewPath.Settings, {
                                screen: SettingsPath.ChangePublicName,
                                params: {
                                    publicName: profile?.publicName,
                                },
                            });
                        }}
                    />
                    <SettingsRow
                        labelTx="settingsScreen:avatar"
                        icon="edit"
                        onPress={() => {
                            navigation.navigate(OverviewPath.Settings, {
                                screen: SettingsPath.ChangeAvatar,
                                params: {
                                    avatar: profile?.avatar,
                                    seed: profile?.publicName || profile?.email || 'Clara Barton',
                                },
                            });
                        }}
                        isLast
                    />
                </SettingsSection>

                <SettingsSection titleTx="settingsScreen:sharing">
                    <SettingsRow
                        labelTx="settingsScreen:connectedUsers"
                        icon="chevron-right"
                        onPress={() => {
                            navigation.navigate(OverviewPath.Settings, {
                                screen: SettingsPath.ConnectedUsers,
                            });
                        }}
                    />
                    <SettingsRow
                        labelTx="settingsScreen:groups"
                        icon="chevron-right"
                        onPress={() => {
                            navigation.navigate(OverviewPath.Settings, {
                                screen: SettingsPath.Groups,
                            });
                        }}
                    />
                    <SettingsRow
                        labelTx="settingsScreen:pendingConnections"
                        icon="chevron-right"
                        onPress={() => {
                            navigation.navigate(OverviewPath.Settings, {
                                screen: SettingsPath.PendingRequests,
                            });
                        }}
                    />
                    <SettingsRow
                        labelTx="settingsScreen:sentConnections"
                        icon="chevron-right"
                        onPress={() => {
                            navigation.navigate(OverviewPath.Settings, {
                                screen: SettingsPath.SentRequests,
                            });
                        }}
                        isLast
                    />
                </SettingsSection>

                <SettingsPreferencesSection
                    currencyList={currencyList}
                    currencyValue={currencyValue}
                    currencyDisplayValue={currencyDisplayValue}
                    languageOptions={languageOptions}
                    languageValue={languageValue}
                    languageDisplayValue={languageDisplayValue}
                    isSaving={isSaving}
                    onCurrencyChange={handleCurrencyChange}
                    onLanguageChange={handleLanguageChange}
                />

                <SettingsSection titleTx="settingsScreen:about">
                    <SettingsRow
                        labelTx="settingsScreen:goals"
                        icon="chevron-right"
                        onPress={() => {
                            navigation.navigate(OverviewPath.Settings, {
                                screen: SettingsPath.Goals,
                            });
                        }}
                    />
                    <SettingsRow
                        labelTx="settingsScreen:tutorial"
                        icon="chevron-right"
                        onPress={() => {
                            navigation.navigate(OverviewPath.Settings, {
                                screen: SettingsPath.Tutorial,
                            });
                        }}
                    />
                    <SettingsRow
                        labelTx="settingsScreen:privacyPolicy"
                        icon="open-in-new"
                        onPress={() => PRIVACY_POLICY_URL && openLinkInBrowser(PRIVACY_POLICY_URL)}
                    />
                    <SettingsRow
                        labelTx="settingsScreen:termsOfService"
                        icon="open-in-new"
                        onPress={() => TERMS_OF_SERVICE_URL && openLinkInBrowser(TERMS_OF_SERVICE_URL)}
                    />
                    <SettingsRow labelTx="settingsScreen:appVersion" value={APP_VERSION} isLast />
                </SettingsSection>

                <SettingsLogoutButton />
            </View>
        </ScrollView>
    );
};

const $sections: ViewStyle = {
    marginTop: 24,
};
