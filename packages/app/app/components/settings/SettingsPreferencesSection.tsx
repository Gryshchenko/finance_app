import { ICurrency } from 'tenpercent/shared';

import { LanguageOption } from '@/components/settings/settingsLocales';
import { SettingsPickerRow } from '@/components/settings/SettingsPickerRow';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsSwitchRow } from '@/components/settings/SettingsSwitchRow';
import { useAppTheme } from '@/theme/context';

interface Props {
    currencyList: ICurrency[];
    currencyValue: string | undefined;
    currencyDisplayValue: string | undefined;
    languageOptions: LanguageOption[];
    languageValue: string | undefined;
    languageDisplayValue: string | undefined;
    isSaving: boolean;
    onCurrencyChange: (item: ICurrency) => Promise<void>;
    onLanguageChange: (item: LanguageOption) => Promise<void>;
}

export function SettingsPreferencesSection({
    currencyList,
    currencyValue,
    currencyDisplayValue,
    languageOptions,
    languageValue,
    languageDisplayValue,
    isSaving,
    onCurrencyChange,
    onLanguageChange,
}: Props) {
    const { themeContext, setThemeContextOverride } = useAppTheme();

    return (
        <SettingsSection titleTx="settingsScreen:preferences">
            <SettingsPickerRow<ICurrency>
                labelTx="settingsScreen:defaultCurrency"
                modalTitleTx="settingsScreen:selectCurrency"
                data={currencyList}
                value={currencyValue}
                displayValue={currencyDisplayValue}
                keyExtractor={(item) => String(item.currencyId)}
                labelExtractor={(item) => `${item.currencyName} - ${item.symbol}`}
                onChange={onCurrencyChange}
                disabled={isSaving}
            />
            <SettingsPickerRow<LanguageOption>
                labelTx="common:language"
                modalTitleTx="settingsScreen:selectLanguage"
                data={languageOptions}
                value={languageValue}
                displayValue={languageDisplayValue}
                keyExtractor={(item) => item.locale}
                labelExtractor={(item) => item.label}
                onChange={onLanguageChange}
                disabled={isSaving}
            />
            {/*<SettingsSwitchRow*/}
            {/*    labelTx="settingsScreen:notifications"*/}
            {/*    value={notificationsEnabled}*/}
            {/*    onToggle={setNotificationsEnabled}*/}
            {/*/>*/}
            <SettingsSwitchRow
                labelTx="settingsScreen:darkMode"
                value={themeContext === 'dark'}
                onToggle={() => {
                    setThemeContextOverride(themeContext === 'dark' ? 'light' : 'dark');
                }}
                isLast
            />
        </SettingsSection>
    );
}
