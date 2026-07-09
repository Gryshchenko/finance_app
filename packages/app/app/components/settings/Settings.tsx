import { FC } from 'react';
import { ScrollView, View, ViewStyle } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';

import { SettingsLogoutButton } from '@/components/settings/SettingsLogoutButton';
import { SettingsPreferencesSection } from '@/components/settings/SettingsPreferencesSection';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { useSettingsProfile } from '@/hooks/useSettingsProfile';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath } from '@/navigators/SettingsStackNavigator';
import { OverviewPath } from '@/types/OverviewPath';
import { openLinkInBrowser } from '@/utils/openLinkInBrowser';

const APP_VERSION = 'v1.0.0';

// Placeholder URLs - replace with real endpoints before release
const PRIVACY_POLICY_URL = '';
const TERMS_OF_SERVICE_URL = '';

export const Settings: FC = function Settings() {
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
        <ScrollView>
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
